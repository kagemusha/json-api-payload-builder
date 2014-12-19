/* jshint node:true */
/* global describe, it */

var assert = require("assert");
var _ = require("underscore");
var buildPayload = require("../lib/json-api-payload-builder.js");

function build(name, id, additionalProps){
  var obj =  {id: id, name: name+id};
  return _.extend(obj, additionalProps);
}

function logObject(object, title){
  var obj = JSON.stringify(object);
  var titleStr = title ? (title + ": ") : "";
  console.log(titleStr + obj);
}

describe('Builder Tests:', function(){

  it('should build simple payloads', function(){
    var item = {id: 1, name: "a1"};
    var payload = buildPayload('items', item);
    assert.deepEqual(payload, {items: [item]});

    payload = buildPayload('items', [item]);
    assert.deepEqual(payload, {items: [item]});
  });

  /*
    proper link syntax means if a containing objects has a property which is an
    object it is a hasOne association, and if an array, a hasMany association.
    both are put in arrays under a pluralized property in links.  in the
    containing objects links property, hasOne objects become a singular key with
    an id, whereas hasMany arrays become an id array with a plural key.
   */
  it('should extract embedded objects as links with proper link syntax', function(){
    var item = build('item', 1);
    var oItem = build('oItem', 1);
    var mItems = [build('mItem', 1), build('mItem', 2)];
    var omItems = [build('omItem',1), build('omItem',2)];
    item.oItem = oItem;
    item.mItems = mItems;
    item.oItem.omItems = omItems;
    var payload = buildPayload('items', item);

    var expectedPayload =
          { "items": [
              { "id":1,"name":"item1","links":{"oItem":1, "mItems": [1,2]} }
            ],
            "linked":{
              "oItems":[{id: 1, name: 'oItem1', links: {omItems: [1,2]}}],
              "omItems": omItems,
              "mItems": mItems
            }
          };

    assert.deepEqual(payload, expectedPayload);
  });

  it('should not extract excluded keys', function(){
    var item = build('item', 1, {auth: {key: 'kkk', id: "xyz"}});
    var payload = buildPayload('items', item, {excludedKeys: 'auth'});
    assert.deepEqual(payload, {'items': [item]});
  });

  it('should not duplicate duplicate embedded objects in linked', function(){
    var iType = build('iType', 1);
    var item1 = build('item',1, {iType: iType});
    var item2 = build('item',2, {iType: iType});
    var payload = buildPayload('items', [item1, item2]);
    var expectedPayload =
      {"items": [
                  { "id":1,"name":"item1","links":{"iType":1} },
                  { "id":2,"name":"item2","links":{"iType":1} }
                ],
        "linked":{ "iTypes":[{"id":1,"name":"iType1"}] }
      };
    assert.deepEqual(payload, expectedPayload);

  });

  it('should create polymorphic links with the polymorphicTypes option', function(){
    var drawing1 = build('drawing', 1);
    var drawing2 = build('drawing', 2);
    var shape1 = build('shape',1, {type: 'circle'});
    var shape2 = build('shape',2, {type: 'square'});
    var shape3 = build('shape',3, {type: 'circle'});
    //associations MUST be supertype
    drawing1.shapes = [shape1];
    drawing2.shapes = [shape2, shape3];

    var payload = buildPayload('drawings', [drawing1, drawing2], {polymorphicTypes: 'shapes'});
    var expectedPayload =
    {"drawings": [
      { "id":1,"name":"drawing1","links":{"shapes":[{id: 1, type: 'circle'}]} },
      { "id":2,"name":"drawing2","links":{"shapes":[{id: 2, type: 'square'}, {id: 3, type: 'circle'}]} }
    ],
      "linked":{"circles":[shape1, shape3], "squares":[shape2]}
    };
    assert.deepEqual(payload, expectedPayload);
  });

  it('should use optional linkBackTypes to link embedded objects to their parent', function() {
    var item = build('item', 1);
    var childItem1 = build('childItem', 1);
    item.childItems = [childItem1, build('childItem', 2)];
    childItem1.grandChildItems = build('grandChildItem', 1);
    var payload = buildPayload('items', item, {linkBackTypes: ['childItem', 'grandChildItem']});

    var expectedPayload =
    { "items": [
      { "id": 1, "name": "item1", "links": {"childItems": [1, 2]} }
    ],
      "linked": {
        "childItems": [
          { id: 1, name: 'childItem1', links: {item: 1, "grandChildItem": 1} },
          { id: 2, name: 'childItem2', links: {item: 1} }
        ],
        "grandChildItems": [
          { id: 1, name: 'grandChildItem1', links: {'childItem': 1}}
        ]
      }
    };
    assert.deepEqual(payload, expectedPayload);
  });

  //parentLink
  it('should create parent links specified with the parentLink option', function(){
    var drawing1 = build('drawing', 1);
    var drawing2 = build('drawing', 2);

    var payload = buildPayload('drawings', [drawing1, drawing2], {parentLink: {type: 'project', link: {id: 1, type: 'civil_project'}}});
    var expectedPayload =
    {"drawings": [
        { "id":1,"name":"drawing1","links":{"project":{id: 1, type: 'civil_project'}} },
        { "id":2,"name":"drawing2","links":{"project":{id: 1, type: 'civil_project'}} }
      ]
    };
    // logObject(payload);
    // logObject(expectedPayload);
    assert.deepEqual(payload, expectedPayload);
  });

  it('should not clobber existing links', function(){
    var item = build('item', 1, {
      bar: build('bar', 2),
      links: {
        foo: 2,
      }
    });

    var payload = buildPayload('item', item);
    var expectedPayload = {
      items: [
        {
          id: 1,
          name: "item1",
          links: {
            foo: 2,
            bar: 2
          }
        },
      ],
      linked: {
        bars: [
          {
            id: 2,
            name: "bar2"
          }
        ]
      }
    };
    // logObject(payload);
    // logObject(expectedPayload);
    assert.deepEqual(payload, expectedPayload);
  });

  it('should not work with nulls', function(){
    var item = build('item', 1, {
      bar: null,
    });

    var payload = buildPayload('item', item);
    var expectedPayload = {
      items: [
        {
          id: 1,
          name: "item1",
          bar: null
        },
      ],
    };
    assert.deepEqual(payload, expectedPayload);
  });

  it('should remove undefined keys', function(){
    var item = build('item', 1, {
      bar: undefined,
    });

    var payload = buildPayload('item', item);
    var expectedPayload = {
      items: [
        {
          id: 1,
          name: "item1",
        },
      ],
    };
    assert.deepEqual(payload, expectedPayload);
  });

  it('should map with the mappings property', function(){
    var manager = build('employee', 1);
    var assistant = build('employee', 2);

    var dept = build('department', 1, {
      manager: manager,
      assistant: assistant
    });
    var payload = buildPayload('department', dept, {mappings: {manager: "employee", assistant: "employee"}})
    var expectedPayload = {
      departments: [
        {
          id: 1,
          name: "department1",
          links: {manager: manager.id, assistant: assistant.id}
        }
      ],
      linked: {
        employees: [ manager, assistant ]
      }
    };
    assert.deepEqual(payload, expectedPayload);
  })
});
