var previous_tags = [];
var currentID = null;

keys_disabled = false;
keymap = {};

$(document).keydown(function(e) {
    if( keys_disabled )
        return;

    if( typeof keymap[e.key] == 'undefined' )
        return;

    keymap[e.key]();
})

function nextInbox() {
    function fillItAll(obj) {
        $("#image").html("");
        $("#image").append(
            $("<img>").attr({
                "src": obj['file_web']
            })
        );
    }

    $.ajax({
        "url": "/ingest/next",
        "success": function(resp) {
            resp = $.parseJSON( resp );
            if( resp['status'] != 'OK' ) {
                alert("There are no more images to process...");
                return
            }

            fillItAll(resp['result']);
            currentID = resp['result']['_id']['$oid']
        }
    })
}


function _action_skeleton(el, fn) {
    return $("<div class='action'>").append(el).click(fn)
}

function action_rotateit() {
    var f = function() {
        $.ajax({
            method:"POST",
            url:"/ingest/rotate",
            data:{"id":currentID},
            success:function() {
                $("img").toggleClass("rotated");
            }
        })
    };

    keymap["r"] = f;
    return _action_skeleton( "<b>r</b>otate me", f )
}
function action_trashit() {
    var f = function() {
        $.ajax({
            method:"POST",
            url:"/ingest/trash",
            data:{"id":currentID},
            success:function() {
                nextInbox();
            }
        })
    }

    keymap["t"] = f;
    return _action_skeleton("<b>t</b>rash me",f);
}

function action_markdone() {
    var f = function() {
        $.ajax({
            method:"POST",
            url:"/ingest/done",
            data:{"id":currentID},
            success:function() {
                nextInbox();
            }
        })
    }
    keymap["d"] = f;
    return _action_skeleton("mark as <b>d</b>one",f);
}

function action_tagit() {
    var tag_input = $("<input>");
    tag_input.click( function(e) {
        e.stopPropagation();
    });
    tag_input.autocomplete({
        source:autocomplete_tags
    });
    tag_input.focus(function(){
        keys_disabled = true;
    }).blur(function(){
        keys_disabled = false;
    })

    var thingy = $("<div>").html("add a new tag:");
    thingy.append(
        tag_input
    );

    return _action_skeleton(
        thingy,
        function() {
            var tag = tag_input.val();

            $.ajax({
                method:"POST",
                url:"/ingest/tag",
                data:{
                    "id":currentID,
                    "tag":tag
                },
                success:function() {
                    if( $.inArray(tag, previous_tags) < 0 ) {
                        $("#actions").append(
                            action_tagit_fixed(tag)
                        );
                        previous_tags.push( tag );
                    }
                }
            })
        }
    );
}

function action_tagit_fixed(tag) {

    var f = function() {
        $.ajax({
            method:"POST",
            url:"/ingest/tag",
            data:{
                "id":currentID,
                "tag":tag
            }
        })
    };

    var thisnum = previous_tags.length + 1;
    thisnum = thisnum.toString();

    keymap[thisnum] = f;

    return _action_skeleton("(<b>"+thisnum+"</b>) add tag \"" + tag + "\"",f);
}

$(document).ready(function(){
    nextInbox();

    //actions kind of stay the same for all images

    $("#actions").html("");
    $("#actions").append(
        action_rotateit(),
        action_trashit(),
        action_markdone(),
        action_tagit()
    )
})