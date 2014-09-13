(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['inflection'], factory);
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require('inflection'));
  } else {
    // Browser globals (root is window)
    root.buildPayload = factory(root.inflection);
  }
})(this, function(inflection) {


  var _singularize = inflection.singularize;
  var _pluralize = inflection.pluralize;

  /*options*/
  var _excludedKeys;
  var _polymorphicTypes;
  var _linkBackTypes;
  var _parentLink;

  var _linked;

  var buildPayload = function(root, json, options) {
    console.log("root: " + root);
    root = _pluralize(root);
    options = options || {};
    _excludedKeys = options.excludedKeys || [];
    _polymorphicTypes = options.polymorphicTypes || [];
    _linkBackTypes = options.linkBackTypes || [];
    _parentLink = options.parentLink;

    _linked = {};
    var clonedJson = deepClone(json);
    var rootArray = (clonedJson instanceof Array) ? clonedJson : [ clonedJson ];
    var payload = {};
    payload[root] = rootArray;

    rootArray.forEach(function (item) {
      traverse(root, item);
    });
    if (!isEmpty(_linked)) {
      payload.linked = _linked;
    }

    if (_parentLink) {
      rootArray.forEach(function (rootItem) {
        if (!rootItem.links) {
          rootItem.links = {};
        }
        rootItem.links[_parentLink.type] = _parentLink.link;
      });
    }

    return payload;
  }

  function traverse(parentType, parentObj) {
    for (var key in parentObj) {
      processProp(parentType, parentObj, key);
    }
  }

  // reason this method extracted is jshint complains about forEach function
  // inside the for loop in traverse
  function processProp(parentType, parentObj, key) {
    if (key === "meta" || key === "links" || _excludedKeys.indexOf(key) > -1) {
      return;
    }
    var child = parentObj[key];

    //must test if Array first since Array is also an Object
    if (child instanceof Array) {
      if (child.length === 0) {
        return;
      }
      addHasManyLinkProp(parentObj, key, child);
      child.forEach(function (childObj) {
        link(parentType, key, parentObj, childObj);
        traverse(key, childObj);
      });
    }
    else if (child instanceof Object) {
      addHasOneLinkProp(parentObj, key);
      link(parentType, key, parentObj, child);
      traverse(key, child);
    }
    //else is ordinary attr so just leave
  }


  function addHasOneLinkProp(container, key) {
    if (!container.links) {
      container.links = {};
    }
    container.links[_singularize(key)] = null;
  }

  function addHasManyLinkProp(container, key) {
    if (!container.links) {
      container.links = {};
    }
    container.links[_pluralize(key)] = [];
  }


  function link(parentType, key, parentObj, childObj) {
    parentType = _singularize(parentType);
    var childBaseType = _singularize(key);
    var childType = isPolymorphic(childBaseType) ? childObj.type : childBaseType;
    var keyPlural = _pluralize(childType);
    if (!_linked[keyPlural]) {
      _linked[keyPlural] = [];
    }
    if (!hasDuplicateId(childObj, _linked[keyPlural])) {
      _linked[keyPlural].push(childObj);
    }
    delete parentObj[key];

    addLinksEntry(parentObj, childBaseType, childObj);

    if (_linkBackTypes.indexOf(childBaseType) > -1) {
      addHasOneLinkProp(childObj, parentType, parentObj);
      addLinksEntry(childObj, parentType, parentObj);
    }
  }

  function addLinksEntry(linksHolder, linkedObjBaseType, linkedObj) {
    var link = linkedObj.id;
    if (isPolymorphic(linkedObjBaseType)) {
      link = {id: linkedObj.id, type: linkedObj.type};
    }
    var baseTypePlural = _pluralize(linkedObjBaseType);
    if (linksHolder.links[baseTypePlural]) {
      linksHolder.links[baseTypePlural].push(link);
    } else {
      linksHolder.links[_singularize(linkedObjBaseType)] = link;
    }
  }


  function deepClone(object) {
    return JSON.parse(JSON.stringify(object));
  }

  function isEmpty(obj) {
    if (obj === null) return true;
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;

    for (var key in obj) {
      if (hasOwnProperty.call(obj, key)) return false;
    }
    return true;
  }

  function hasDuplicateId(obj, array) {
    var id = obj.id;
    for (var i = 0; i < array.length; i++) {
      if (array[i].id === id) {
        return true;
      }
    }
    return false;
  }

  function isPolymorphic(type) {
    return _polymorphicTypes.indexOf(type) > -1;
  }
  return buildPayload;
});

