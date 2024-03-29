/**
 * plugin.js
 *
 * ========================================================================
 * Open eClass 3.0
 * E-learning and Course Management System
 * ========================================================================
 * Copyright 2003-2014  Greek Universities Network - GUnet
 * A full copyright notice can be read in "/info/copyright.txt".
 * For a full list of contributors, see "credits.txt".
 *
 * Open eClass is an open platform distributed in the hope that it will
 * be useful (without any warranty), under the terms of the GNU (General
 * Public License) as published by the Free Software Foundation.
 * The full license can be read in "/info/license/license_gpl.txt".
 *
 * Contact address: GUnet Asynchronous eLearning Group,
 *                  Network Operations Center, University of Athens,
 *                  Panepistimiopolis Ilissia, 15784, Athens, Greece
 *                  e-mail: info@openeclass.org
 * ======================================================================== */

tinymce.PluginManager.add('eclmedia', function(editor, url) {
    function createLinkList(callback) {
        return function() {
            var linkList = editor.settings.link_list;

            if (typeof (linkList) === "string") {
                tinymce.util.XHR.send({
                    url: linkList,
                    success: function(text) {
                        callback(tinymce.util.JSON.parse(text));
                    }
                });
            } else if (typeof (linkList) === "function") {
                linkList(callback);
            } else {
                callback(linkList);
            }
        };
    }

    function buildListItems(inputList, itemCallback, startItems) {
        function appendItems(values, output) {
            output = output || [];

            tinymce.each(values, function(item) {
                var menuItem = {text: item.text || item.title};

                if (item.menu) {
                    menuItem.menu = appendItems(item.menu);
                } else {
                    menuItem.value = item.value;

                    if (itemCallback) {
                        itemCallback(menuItem);
                    }
                }

                output.push(menuItem);
            });

            return output;
        }

        return appendItems(inputList, startItems || []);
    }

    function showDialog(linkList) {
        var data = {}, selection = editor.selection, dom = editor.dom, selectedElm, anchorElm, initialText;
        var win, onlyText, textListCtrl, linkListCtrl, relListCtrl, targetListCtrl, linkTitleCtrl, value;

        function linkListChangeHandler(e) {
            var textCtrl = win.find('#text');

            if (!textCtrl.value() || (e.lastControl && textCtrl.value() === e.lastControl.text())) {
                textCtrl.value(e.control.text());
            }

            win.find('#href').value(e.control.value());
        }

        function buildAnchorListControl(url) {
            var anchorList = [];

            tinymce.each(editor.dom.select('a:not([href])'), function(anchor) {
                var id = anchor.name || anchor.id;

                if (id) {
                    anchorList.push({
                        text: id,
                        value: '#' + id,
                        selected: url.indexOf('#' + id) !== -1
                    });
                }
            });

            if (anchorList.length) {
                anchorList.unshift({text: 'None', value: ''});

                return {
                    name: 'anchor',
                    type: 'listbox',
                    label: 'Anchors',
                    values: anchorList,
                    onselect: linkListChangeHandler
                };
            }
        }

        function updateText() {
            if (!initialText && data.text.length === 0 && onlyText) {
                this.parent().parent().find('#text')[0].value(this.value());
            }
        }

        function urlChange(e) {
            var meta = e.meta || {};

            if (linkListCtrl) {
                linkListCtrl.value(editor.convertURL(this.value(), 'href'));
            }

            tinymce.each(e.meta, function(value, key) {
                win.find('#' + key).value(value);
            });

            if (!meta.text) {
                updateText.call(this);
            }
        }

        function isOnlyTextSelected(anchorElm) {
            var html = selection.getContent();

            // Partial html and not a fully selected anchor element
            if (/</.test(html) && (!/^<a [^>]+>[^<]+<\/a>$/.test(html) || html.indexOf('href=') === -1)) {
                return false;
            }

            if (anchorElm) {
                var nodes = anchorElm.childNodes, i;

                if (nodes.length === 0) {
                    return false;
                }

                for (i = nodes.length - 1; i >= 0; i--) {
                    if (nodes[i].nodeType !== 3) {
                        return false;
                    }
                }
            }

            return true;
        }

        selectedElm = selection.getNode();
        anchorElm = dom.getParent(selectedElm, 'a[href]');
        onlyText = isOnlyTextSelected();

        data.text = initialText = anchorElm ? (anchorElm.innerText || anchorElm.textContent) : selection.getContent({format: 'text'});
        data.href = anchorElm ? dom.getAttrib(anchorElm, 'href') : '';

        if ((value = dom.getAttrib(anchorElm, 'target'))) {
            data.target = value;
        } else if (editor.settings.default_link_target) {
            data.target = editor.settings.default_link_target;
        }

        if ((value = dom.getAttrib(anchorElm, 'rel'))) {
            data.rel = value;
        }

        if ((value = dom.getAttrib(anchorElm, 'class'))) {
            data['class'] = value;
        }

        if ((value = dom.getAttrib(anchorElm, 'title'))) {
            data.title = value;
        }

        if (onlyText) {
            textListCtrl = {
                name: 'text',
                type: 'textbox',
                size: 40,
                label: 'Text to display',
                onchange: function() {
                    data.text = this.value();
                }
            };
        }

        if (linkList) {
            linkListCtrl = {
                type: 'listbox',
                label: 'Link list',
                values: buildListItems(
                        linkList,
                        function(item) {
                            item.value = editor.convertURL(item.value || item.url, 'href');
                        },
                        [{text: 'None', value: ''}]
                        ),
                onselect: linkListChangeHandler,
                value: editor.convertURL(data.href, 'href'),
                onPostRender: function() {
                    linkListCtrl = this;
                }
            };
        }

        if (editor.settings.target_list !== false) {
            if (!editor.settings.target_list) {
                editor.settings.target_list = [
                    {text: 'None', value: ''},
                    {text: 'New window', value: '_blank'}
                ];
            }

            targetListCtrl = {
                name: 'target',
                type: 'listbox',
                label: 'Target',
                values: buildListItems(editor.settings.target_list)
            };
        }

        if (editor.settings.rel_list) {
            relListCtrl = {
                name: 'rel',
                type: 'listbox',
                label: 'Rel',
                values: buildListItems(editor.settings.rel_list)
            };
        }

        if (editor.settings.link_title !== false) {
            linkTitleCtrl = {
                name: 'title',
                type: 'textbox',
                label: 'Title',
                value: data.title
            };
        }

        win = editor.windowManager.open({
            title: 'Insert/Edit Pop-Up Media',
            data: data,
            body: [
                {
                    name: 'href',
                    type: 'filepicker',
                    filetype: 'file',
                    size: 40,
                    autofocus: true,
                    label: 'Url',
                    onchange: urlChange,
                    onkeyup: updateText
                },
                textListCtrl,
                linkTitleCtrl,
                buildAnchorListControl(data.href),
                linkListCtrl,
                relListCtrl,
                targetListCtrl
            ],
            onSubmit: function(e) {
                var href;

                data = tinymce.extend(data, e.data);
                href = data.href;

                // Delay confirm since onSubmit will move focus
                function delayedConfirm(message, callback) {
                    var rng = editor.selection.getRng();

                    window.setTimeout(function() {
                        editor.windowManager.confirm(message, function(state) {
                            editor.selection.setRng(rng);
                            callback(state);
                        });
                    }, 0);
                }

                function insertLink() {
                    var linkAttrs = {
                        href: href,
                        target: data.target ? data.target : null,
                        rel: data.rel ? data.rel : null,
                        "class": 'colorboxframe',
                        title: data.title ? data.title : null
                    };

                    if (anchorElm) {
                        editor.focus();

                        if (onlyText && data.text !== initialText) {
                            if ("innerText" in anchorElm) {
                                anchorElm.innerText = data.text;
                            } else {
                                anchorElm.textContent = data.text;
                            }
                        }

                        dom.setAttribs(anchorElm, linkAttrs);

                        selection.select(anchorElm);
                        editor.undoManager.add();
                    } else {
                        if (onlyText) {
                            editor.insertContent(dom.createHTML('a', linkAttrs, dom.encode(data.text)));
                        } else {
                            editor.execCommand('mceInsertLink', false, linkAttrs);
                        }
                    }
                }

                if (!href) {
                    editor.execCommand('unlink');
                    return;
                }

                // Is www. prefixed
                if (/^\s*www\./i.test(href)) {
                    delayedConfirm(
                            'The URL you entered seems to be an external link. Do you want to add the required http:// prefix?',
                            function(state) {
                                if (state) {
                                    href = 'http://' + href;
                                }

                                insertLink();
                            }
                    );

                    return;
                }

                insertLink();
            }
        });
    }

    editor.addButton('eclmedia', {
        context: 'insert',
        image: url + '/img/video.gif',
        tooltip: 'Insert/Edit Pop-Up Media',
        onclick: createLinkList(showDialog),
        stateSelector: 'a[href].colorboxframe'
    });

    this.showDialog = showDialog;
});
