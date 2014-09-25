json-api-payload-builder
========================

A helper to build json-api payload objects from plain json objects, this is it extracts embedded objects into 
a linked object, leaving links in the containing object with the ids of the embedded objects.

**Note: this does not cover the whole json-api spec.  However, it should be useful in properly converting
embedded objects into linked objects, which can be very useful for mocking api responses.**

So basically it takes something like this:

    var post =  { id: 1, title: 'P1', content: 'blah blah', 
                  author: {id: 1, name: 'kagemusha},
                  comments: [ {id: 1, content: 'this post rocks'}, 
                              {id: 2, content: 'this post sucks'} ]
                }

    var payload = buildPayload('posts', posts)


and builds:

    { posts: [ 
              { id: 1, title: 'P1', content: 'blah blah', 
                links: { author: 1, comments: [1,2]}
              }
            ],
     linked: { authors: [
                          {id: 1, name: 'kagemusha}
                        ],
               comments: [ 
                           {id: 1, content: 'this post rocks'}, 
                           {id: 2, content: 'this post sucks'} 
                        ]
             }
     }
              
                  
Other features include:

1. polymorphic types (assumes the polymorphic types has a type property)

    see `should create polymorphic links with the polymorphicTypes option` test

2. adding a link from embedded objects back to their containing object

    see `should use optional linkBackTypes to link embedded objects to their parent` test)

3. excluding objects from being extracted to linked

    see `should not extract excluded keys` test

4. adding a parent link to top-level objects

    see `should create parent links specified with the parentLink option` test

5. ad-hoc mapping of embedded objects using a different type name

    see `should map with the mappings property` test

[See tests](https://github.com/kagemusha/json-api-payload-builder/blob/master/test/tests.js)


**License: MIT**
