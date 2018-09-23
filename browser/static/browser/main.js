/*
function tag(name) {
    var _this = this;

    this.name = name;

    this.knowsChildren = false;
    this.children = null;

    this.$html = $("<div class='tag'>");
    this.$children = $("<div class='children'>");
    this.$html.append( this.$children );

    this.$btn_cont = $("<div class='btn_cont'>");
    this.$btn_cont.appendTo( this.$html );

    this.$btns = {}
    this.$btns['load'] = $("<div class='btn' style='background-color: blue;'>");
    this.$btns['toggle'] = $("<div class='btn' style='background-color: green;'>");

    this.$btns['load'].click( function() {
        _this.load();
    } );
    this.$btns['toggle'].click( function() {
        _this.toggle();
    } );

    for(var i in this.$btns)
        this.$btn_cont.append(this.$btns[i]);

    this.$html.append( $("<div class='title'>").html(this.name) );

    this.state = false;
}

tag.prototype.load = function() {
    $("#images").html("");

    $.ajax({
        "method":"POST",
        "data":{"tags": JSON.stringify([this.name])},
        "url":"byTag",
        "success": function(resp) {
            resp = $.parseJSON(resp);

            for( var i in resp ) {
                $("#images").append( $("<img>").attr({
                    "src": resp[i].file_web
                }) );
            }

            $("#tags").toggleClass("hidden", true);
        }
    })
}

tag.prototype.toggle = function() {
    if( this.state )
        this.contract();
    else
        this.expand();

    this.state = !this.state;
}

tag.prototype.expand = function() {
    if( ! this.knowsChildren ) {
        this.fillChildren();
    }

    this.$children.toggle(true);
}

tag.prototype.contract = function() {
    this.$children.toggle(true);
}

tag.prototype.fillChildren = function() {
    $.ajax({
        "method":"POST",
        "url":"/browser/tagsInMe",
        "data":{"me":this.info._id.$oid},
        "success":function(resp){
            resp = $.parseJSON(resp);
            this.children = resp;
            this.knowsChildren = true;

            for(var i in this.children) {
                this.$children.append( (new tag(this.children[i])).$html );
            }
        }
    });
}

function loadTags(){
    $.ajax({
        "method":"POST",
        "url":"/browser/topLevel",
        "success": function(resp) {
            resp = $.parseJSON(resp);

            for( var i in resp )
                $("#tags .window").append( (new tag(resp[i])).$html );
        }
    })
}
*/



var previous_tags = [];
var currentID = null;

keys_disabled = false;
keymap = {};

$(document).keydown(function(e) {
    if( keys_disabled )
        return;

    if( typeof keymap[e.key] == 'undefined' )
        return;

    if( e.ctrlKey )
        return;

    keymap[e.key]();
})


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
                $currentCont.find("img").toggleClass("rotated");
            }
        })
    };

    keymap["r"] = f;
    return _action_skeleton( "<b>r</b>otate me", f )
}

function goNext(){
    var nextGuy = $currentCont.nextAll().first();
    nextGuy.find("img").click();
};

function goPrevious(){
    var nextGuy = $currentCont.prevAll().first();
    nextGuy.find("img").click();
};

function action_previous() {
    keymap["p"] = goPrevious;
    return _action_skeleton( "<b>p</b>rev", goPrevious );
}

function action_next() {
    keymap["n"] = goNext;
    return _action_skeleton( "<b>n</b>ext", goNext );
}

function action_trashit() {
    var f = function() {

        $.ajax({
            method:"POST",
            url:"/ingest/trash",
            data:{"id":currentID},
            success:function() {
                // $currentCont.remove();
                goNext();
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
            }
        })
    }
    keymap["d"] = f;
    return _action_skeleton("mark as <b>d</b>one",f);
}

function action_removetag( tag, keyMapIndex ) {
    var $skeleton;

    var f = function() {
        $.ajax({
            method:"POST",
            url:"/browser/removeTag",
            data:{"id":currentID, "tag":tag},
            success:function() {
                var $options = $("#options div span");
                var options = $options.each(function() {return $(this).html();})
                if( $.inArray(tag, options) ){}
                    // $currentCont.remove();

                $skeleton.remove();
            }
        })
    }

    $skeleton = _action_skeleton("(Shift+" + (keyMapIndex+1) + ") remove tag <b>" + tag + "</b>", f );

    var shiftNumbers = ["!","@","#","$","%","^","&","*","("]
    keymap[ shiftNumbers[keyMapIndex] ] = f;
    return $skeleton
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
                            action_tagit_fixed(tag, previous_tags.length + 1)
                        );
                        previous_tags.push( tag );
                    }
                }
            })
        }
    );
}

function action_tagit_fixed(tag, i) {

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

    thisnum = i.toString();

    keymap[thisnum] = f;

    return _action_skeleton("(<b>"+thisnum+"</b>) add tag \"" + tag + "\"",f);
}

var all_offs = [];
var all_off = function() {
    for( var i in all_offs )
        all_offs[i]();
}

var $currentCont = null;

var make_editable = function( $img, img ) {

    var state = 0;

    var $save_img = $img.clone();
    var $cont = $("<div>");
    $cont.append($img);

    var editOn = function() {
        $currentCont = $cont;

        currentID = $img.attr("data-id");

        $replace_with = $('<table id="main"><tr><td id="image"></td><td id="actions"></td></tr></table>');
        $cont.html("").append( $replace_with );
        $("#image").append($save_img);
        $("#actions").append(
            action_rotateit(),
            action_trashit(),
            action_previous(),
            action_next(),
            // action_markdone(),
            action_tagit()
        );

        $('html, body').animate({
            scrollTop: $cont.offset().top
        }, 0);

        var tags = img.tags;
        for( var i=0; i<tags.length; i++ ) {
            $("#actions").append( action_removetag(tags[i], i) )
        }

        var tags = previous_tags;
        for( var i=0; i<tags.length; i++ ) {
            $("#actions").append( action_tagit_fixed(tags[i], (i+1)) )
        }

        state = 1;
    };

    var editOff = function () {
        if( state == 0 ) return;

        $cont.html("");
        $cont.append( make_editable( $save_img, img ) );

        state = 0;
    }
    all_offs.push( editOff );

    $img.click( function() {
        all_off();

        editOn();
    });

    return $cont;
};

loading = false;
$(window).scroll(function() {
    if( loading ) return;

   if($(window).scrollTop() + $(window).height() > $(document).height() - 100) {
       loading = true;

        last_loaded += 10;
        show_images(0, last_loaded);

        loading = false;
   }
});

current_images = [];
last_loaded = 0;

cur_start = null;
cur_end = null;

function show_images(iStart, len) {

    if( cur_end != null ) {
        iStart = cur_end;
    }

    var images = current_images.slice(iStart, iStart+len);

    //$("#images").html("");

    for( var i in images ) {
        var rando = Math.random();
        var $img = $("<img>").attr({
            "src": images[i].file_web + "?" + rando,
            "data-id": images[i]['_id']['$oid']
        });
        $("#images").append( make_editable( $img, images[i] ) );
    }

    cur_end = iStart+len;
}

$(document).ready( function() {

    /*
    loadTags();

    $("#hideshow").click( function() {
        $("#tags").toggleClass("hidden");
    });
    */

    var options = [];

    $("#search input").tagit({
        getOptions: function(){
            console.log( options );
            return options;
        },
        allowSpaces: true
    }).change( function() {

        var stags = [];
        if( $(this).val() != "" )
            stags = $(this).val().split(",")

        $.ajax({
            "method":"POST",
            "data":{"tags": JSON.stringify( stags )},
            "url":"byTag",
            "success": function(resp) {
                var resp = $.parseJSON(resp);

                var images = resp['images'];
                var other_tags = resp['other_tags'];

                current_images = images;
		cur_end = null;
		$("#images").html("");

                show_images(0,10);
                last_loaded = 10;

                $("#num_images").html(images.length + " images");

                $other_tags = $("<div>");
                other_tags.sort();
                for( var i in other_tags )
                    ( function(i) {
                        $link = $("<span>").html(other_tags[i]);
                        if( $.inArray(other_tags[i], stags) < 0 )
                            $link.click(function(){
                                $("#search input").tagit("createTag", other_tags[i]);
                            }).addClass("link");

                        $other_tags.append(
                            $link
                        );
                    })(i);

                $("#options").html( $other_tags );
            }
        });
    } );

    $("#ingest").click(function() {

        $.ajax({
            "method":"POST",
            "url":"ingest",
            "success": function(resp) {
                alert(resp);
            }
        });

    } );
} );


$(document).ready(function(){
    // nextInbox();
    $("#search input").change();
    //actions kind of stay the same for all images
})
