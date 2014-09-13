json-api-payload-builder
========================

A helper to build json-api payload objects from plain json objects, this is it extracts embedded objects into 
a linked object, leaving links in the containing object with the ids of the embedded objects.


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
              
                  
