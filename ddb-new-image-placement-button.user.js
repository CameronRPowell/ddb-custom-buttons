// ==UserScript==
// @name         D&D Beyond CMS Image Placer
// @namespace    https://dndbeyond.com/
// @version      1.0
// @description  Making new image placement easy!
// @author       Halfwing
// @match        https://www.dndbeyond.com/cp/cms/posts/*/edit
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dndbeyond.com
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    const re = /^<img .*? \/>$/;

    // Gives the button a nice icon
    const img_bin = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAFBlWElmTU0AKgAAAAgAAgESAAMAAAABAAEAAIdpAAQAAAABAAAAJgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAEKADAAQAAAABAAAAEAAAAAAmiF/sAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNi4wLjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgoZXuEHAAAAeklEQVQ4Eb2SUQ7AIAhD3e5/Z7eSlNSkOKPJ9kOhPCS61g6/64Pv4qNXc7EOJDfYnRz8Loy9+724fXnIygDA7gJzaArZBjWtq0Yb84hMyGuuuvS1SXUJ0Hhj9BNiFD8lPOdHrTKTnoh8Rv5Qk15vEXTreWKskh+rv2YPzDYh7UaYZq8AAAAASUVORK5CYII=";
    const b_icon = new Image();
    b_icon.src = 'data:image/png;base64,' + img_bin;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function nodeToJson(node) {
        var artist = '';
        var alignment = '';
        var caption = '';
        var src = node.src;
        var alt = node.alt;
        var width = node.width.toString();
        var parent = node.parentNode;

        if (parent.nodeName == "FIGURE") {
            let splitClass = parent.className.split("-");
            alignment = splitClass[splitClass.length - 1];
            var childNodes = parent.childNodes;

            for (var i = 0; i < childNodes.length; i++) {
                var child = childNodes[i];
                if (child.nodeName == "SPAN" && child.className == "artist-credit") {
                    artist = child.innerHTML.substring(0,8) == "Artist: " ? child.innerHTML.substring(8) : child.innerHTML;
                }
                if (child.nodeName == "FIGCAPTION") {
                    caption = child.innerHTML;
                }
            }
        }

        return {
            artist: artist,
            alignment: alignment,
            caption: caption,
            src: src,
            alt: alt,
            width: width
        }
    }

    function addNewImageButton(TM_instance_name) {

        var TM_editor = window.parent.tinymce.get(TM_instance_name);

        TM_editor.addButton('newImagePlacer', {
            tooltip: 'New insert/edit image',
            image: b_icon.src,
            onClick: function() {
                var imgAttr;
                var highlighted = TM_editor.selection.getContent();
                var isImg = re.test(highlighted);
                console.log(highlighted);
                console.log("Is image? "+isImg);

                if (isImg) {
                    var img = TM_editor.selection.getNode();
                    var json = nodeToJson(img);
                    console.log(json);
                    console.log(json.width);

                    TM_editor.windowManager.open({
                    body: [
                        {
                            type: 'form',
                            items: [
                                {
                                    type: 'textbox',
                                    name: 'imgSrc',
                                    label: 'Source',
                                    style: 'width: 300px',
                                    value: json.src,
                                },
                                {
                                    type: 'textbox',
                                    name: 'imgDescription',
                                    label: 'Image description',
                                    value: json.alt,
                                },
                                {
                                    type: 'textbox',
                                    name: 'imgWidth',
                                    subtype: 'number',
                                    label: 'Width',
                                    value: json.width,
                                },
                                {
                                    type: 'textbox',
                                    name: 'imgArtist',
                                    label: 'Artist',
                                    tooltip: 'Only the artist name',
                                    value: json.artist,
                                },
                                {
                                    type: 'textbox',
                                    name: 'imgCaption',
                                    label: 'Caption',
                                    tooltip: 'A caption to place below the image',
                                    value: json.caption,
                                },
                                {
                                    type: 'listbox',
                                    name: 'imgAlignment',
                                    label: 'Alignment',
                                    values: [
                                        { text: 'Center', value: 'center' },
                                        { text: 'Left', value: 'left' },
                                        { text: 'Right', value: 'right' },
                                    ],
                                    value: json.alignment,
                                }
                            ]
                        },
                    ],
                    title: 'Insert/edit image (New!)',
                    onsubmit: function (e) {
                        var data = TM_editor.windowManager.windows[0].toJSON();
                        e.preventDefault();

                        TM_editor.selection.select(TM_editor.selection.getNode().parentNode);
                        insertImage(data);
                        TM_editor.windowManager.close();
                    }
                });
                }

                else {
                    TM_editor.windowManager.open({
                        body: [
                            {
                                type: 'form',
                                items: [
                                    {
                                        type: 'textbox',
                                        name: 'imgSrc',
                                        label: 'Source',
                                        style: 'width: 300px',
                                    },
                                    {
                                        type: 'textbox',
                                        name: 'imgDescription',
                                        label: 'Image description',
                                    },
                                    {
                                        type: 'textbox',
                                        name: 'imgWidth',
                                        subtype: 'number',
                                        size: 4,
                                        min: 1,
                                        max: 1200,
                                        label: 'Width',
                                    },
                                    {
                                        type: 'textbox',
                                        name: 'imgArtist',
                                        label: 'Artist',
                                        tooltip: 'Only the artist name'
                                    },
                                    {
                                        type: 'textbox',
                                        name: 'imgCaption',
                                        label: 'Caption',
                                        tooltip: 'A caption to place below the image'
                                    },
                                    {
                                        type: 'listbox',
                                        name: 'imgAlignment',
                                        label: 'Alignment',
                                        values: [
                                            { text: 'Center', value: 'center' },
                                            { text: 'Left', value: 'left' },
                                            { text: 'Right', value: 'right' },
                                        ],
                                        value: 'center',
                                    }
                                ]
                            },
                        ],
                        title: 'Insert/edit image (New!)',
                        //onpageshow: function () { console.log("You did it!"); },
                        onsubmit: function (e) {
                            var data = TM_editor.windowManager.windows[0].toJSON();
                            e.preventDefault();

                            TM_editor.selection.setCursorLocation(TM_editor.selection.getStart());
                            insertImage(data);
                            TM_editor.windowManager.close();
                        }
                    });
                }
            }
        });

        function insertImage(imgJSON) {
            TM_editor.undoManager.beforeChange();
            TM_editor.undoManager.add();

            //var text = TM_editor.selection.getContent({format: 'text'});
            insertFigure(imgJSON);

            TM_editor.undoManager.add();
        }

        function insertFigure(imgJSON) {
            //TM_editor.selection.setCursorLocation(TM_editor.selection.getStart());
            TM_editor.selection.setContent([
                '<figure class="article-art article-art-',
                imgJSON.imgAlignment,
                '">',
                imgJSON.imgArtist != "" ? '<span class="artist-credit">Artist: ' + imgJSON.imgArtist + '</span>' : '',
                '<img src="',
                imgJSON.imgSrc,
                '" alt="',
                imgJSON.imgDescription,
                '" width="',
                imgJSON.imgWidth,
                '" />',
                imgJSON.imgCaption != "" ? '<figcaption>' + imgJSON.imgCaption + '</figcaption>' : '',
                '</figure>'
            ].join(''));
        }

        var button = TM_editor.buttons.newImagePlacer;
        var button_groups = TM_editor.theme.panel.find('toolbar buttongroup');
        var last_bg = button_groups[button_groups.length - 1];

        last_bg._lastRepaintRect = last_bg._layoutRect;
        last_bg.append(button);
    }

    const customCSS = `
body#tinymce {
    max-width: 1180px;
    font-size: 16px;
    line-height: 30px;
}

#tinymce blockquote {
    font-size: inherit;
    line-height: inherit;
}



body:not(.body-forum):not(.section-posts):not(.section-changelog):not(.body-privatemessage-details) blockquote {
    color: #000;
    border-style: solid;
    border-width: 1px;
    border-color: #000;
    color: #000;
    border-color: #d3d3d3;
    background: #e0e0e0;
    margin: 19.5px 5px 19.5px 5px;
    padding: 12px;
    border-style: solid;
    border-width: 1px;
    overflow: hidden;
    text-overflow: ellipsis;
    border-radius: 5px;
}

body:not(.body-forum):not(.section-posts):not(.section-changelog):not(.body-privatemessage-details) blockquote:before {
    display: none;
}

body:not(.body-forum):not(.section-posts):not(.section-changelog):not(.body-privatemessage-details) blockquote:after {
    display: none;
}

p {
    margin-bottom: 12px;
}

figure.article-art {
    /* margin: 10px 0; */
    position: relative;
}

.article-art {
    margin: 24px auto 10px;
    width: fit-content;
}

figure .artist-credit-left, figure.article-art-left .artist-credit {
    text-align: start;
    left: 0;
    transform: translateY(15px);
    top: -36px;
}

figure .artist-credit-right, figure.article-art-center .artist-credit, figure.article-art-right .artist-credit {
    text-align: end;
    right: 0;
    transform: translateY(15px);
    top: -36px;
}

figure .artist-credit, figure .artist-credit-left, figure .artist-credit-right {
    display: block;
    position: absolute;
    text-transform: uppercase;
    font-size: 10px;
    font-weight: 600;
    color: #565a62;
}

.article-art figcaption {
    text-align: center;
    font-size: 14px;
    font-weight: 700;
    font-style: italic;
    text-transform: uppercase;
    margin: 10px 0;
    display: block;
}

.article-art-center, .article-art-center img {
    text-align: center;
    display: block;
}

:is(.article-art-left, .article-art-right) img {
    margin: 0 auto;
    display: block;
}

.article-art-left, .article-art-right {
    padding-top: 0!important;
    padding-bottom: 0!important;
}

.article-art-left {
    padding-right: 10px;
}

.article-art-right {
    padding-left: 10px;
}

@media (min-width: 768px) {
    .article-art-left {
        float: left;
    }
}

@media (min-width: 768px) {
    .article-art-right {
        float: right;
    }
}

.author-bio {
    font-style: italic;
}

.epigraph--with-author p:last-child {
    font-style: italic;
    text-align: right;
}

:is(p, li, table) a:not(.tooltip-hover, .ddb-lightbox-outer) {
    color: #006ABE !important;
}

h2:after {
    content: '';
    width: 100%;
    margin: 5px auto 20px;
    height: 1px;
    background-color: #47D18C;
    display: block;
}

h3 {
    font-size: 20px !important;
    font-weight: 700 !important;
}

h3:after {
    display: none !important;
}

figure.article-art.Misc--Dropshadow {
    margin: 24px auto;
}
    `;


    // There is certainly a better way to do this, but this works for now
    async function hackWaitForLoadReinitialize() {
        await sleep(5000);

        let iFrame = document.getElementById("field-body-wysiwyg_ifr");
        let doc = iFrame.contentDocument;
        doc.head.innerHTML += '<style type=text/css>' + customCSS + '</style>';

        var tinyMCEs = document.getElementsByClassName("mce-tinymce mce-container mce-panel");
        addNewImageButton(tinyMCEs[0].parentElement.getElementsByTagName("textarea")[0].id);
    };
    hackWaitForLoadReinitialize();
})();
