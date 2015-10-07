'use strict';
module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        shell: {
            generateJSON: {
                command: 'jsdoc --configure ./conf.json ./video.js/src/js > cumulative.json'
            },
            cloneVideoJS: {
                // Once 5.0 is in stable the line below should be use instead
                // command: 'rm -rf ./video.js && git clone -b stable --single-branch https://github.com/videojs/video.js.git'
                command: 'rm -rf ./video.js && git clone -b master --single-branch https://github.com/videojs/video.js.git'
            },
        },
        concat: {
            dist: {
                src: ['var-name.txt',
                    'cumulative.json',
                    'semicolon.txt'
                ],
                dest: 'doc-data-full.js'
            }
        },
        uglify: {
            dist: {
                src: 'doc-data-full.js',
                dest: 'doc-data.js'
            }
        }
    });
    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.task.registerTask('createFiles', 'Create files into which docs will be injected', function () {
        var classData = [],
            docData = '',
            contentStr = '<!DOCTYPE html> <html lang="en"> <head> <meta http-equiv="Content-Type" content="text/html; charset=utf-8" /> <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no, width=device-width" /><title></title> <link rel="stylesheet" type="text/css" href="//cdnjs.cloudflare.com/ajax/libs/foundation/5.5.2/css/foundation.min.css"> <link rel="stylesheet" type="text/css" href="//cdnjs.cloudflare.com/ajax/libs/foundation/5.5.2/css/normalize.css"> <script src="//use.edgefonts.net/source-code-pro.js">//comment</script> <link href="http://fonts.googleapis.com/css?family=Open+Sans:400italic,700italic,400,700" rel="stylesheet" type="text/css"> <link rel="stylesheet" type="text/css" href="//docs.brightcove.com/en/styles/bcls-doc-site.css"> <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/8.8.0/styles/atelier-forest.light.min.css"> <link href="http://fonts.googleapis.com/css?family=Open+Sans:400italic,700italic,400,700" rel="stylesheet" type="text/css"> <script> (function(i,s,o,g,r,a,m){i["GoogleAnalyticsObject"]=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o), m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m) })(window,document,"script","//www.google-analytics.com/analytics.js","ga"); ga("create", "UA-2728311-29", "auto"); ga("send", "pageview"); </script> <script src="//cdnjs.cloudflare.com/ajax/libs/foundation/5.5.2/js/vendor/modernizr.js">//comment</script> </head><body><div id="navWrapper" class="fixed"><!-- header navbar --> </div>  <nav id="breadCrumbWrapper" class="breadcrumbs show-for-medium-up"><!-- breadcrumbs --></nav>  <div id="searchModal" class="reveal-modal" data-reveal><!-- search --></div>  <div class="row"><div id="inPageNav" class="sidebar large-2 columns show-for-large-up"><!-- sidenav --></div>  <div id="main" class="large-10 small-12 columns"><!-- content --></div> </div></body> </html>',
            DOMParser = require('xmldom').DOMParser,
            XMLSerializer = require('xmldom').XMLSerializer,
            doc,
            doc_data = {},
            docsPath = 'https://github.com/videojs/video.js/blob/master/src/js/',
            title,
            // data structures
            classes = {
                thisClass: [],
                parentClass: []
            },
            // paths
            classFilePath,
            parentClassFilePath,
            // elements
            mainContent,
            main,
			inPageNav,
            doc_body,
            docContentStr;
        //read the JSDoc JSON into a variable
        docData = grunt.file.readJSON('cumulative.json');
        // extract the class items from the doc data
        classData = getSubArray(docData, 'kind', 'class');
        // now create the array of filenames
        createFilenameArray(classData);
        /**
         * get a subset of objects in array of objects
         * based on some property value
         *
         * @param {array} targetArray - array to search
         * @param {string} objProperty - object property to search
         * @param {string|number} value - value of the property to search for
         * @return {array} array of objects with matching property value
         */
        function getSubArray(targetArray, objProperty, value) {
            var i, totalItems = targetArray.length,
                idxArr = [];
            for (i = 0; i < totalItems; i++) {
                if (targetArray[i][objProperty] === value) {
                    idxArr.push(targetArray[i]);
                }
            }
            return idxArr;
        }
        /**
         * create the HTML files for the classes
         * @param {array} filenameArray - array of the filenames
         */
        function createFiles(filenameArray) {
            var i,
                iMax = filenameArray.length,
                filename,
                fullpath,
                reLT = new RegExp('&lt;', 'g'),
                reGT = new RegExp('&gt;', 'g');
            function writeFile() {
                // create file with name=filename and contents=contentStr
                docContentStr = new XMLSerializer().serializeToString(doc);
                // convert bracket character codes to brackets
                docContentStr = docContentStr.replace(reLT, '<');
                docContentStr = docContentStr.replace(reGT, '>');
                fullpath = './docs/api/' + filename;
                grunt.file.write(fullpath, docContentStr);
            }
            for (i = 0; i < iMax; i++) {
                filename = filenameArray[i];
                doc = new DOMParser().parseFromString(contentStr);
                // generate the main contents
                contentInit(filename, writeFile);
            }
        }

        function createFilenameArray(classData) {
            var filenameArray = [],
                i,
                iMax = classData.length,
                item,
                str;
            // extract the filenames from the class items
            for (i = 0; i < iMax; i++) {
                item = classData[i];
                str = item.meta.filename;
                str = str.substr(str.lastIndexOf('/') + 1);
                str = str.replace('.js', '.html');
                filenameArray.push(str);
            }
            // videojs is special case
            filenameArray.push('video.html');
            filenameArray = filenameArray.sort();
            console.log('filenameArray', filenameArray);
            // now create the files
            createFiles(filenameArray);
        }
        /**
         * tests for all the ways a variable might be undefined or not have a value
         *
         * @param {*} x - the variable to test
         * @return {Boolean} true if variable is defined and has a value
         */
        function isDefined(x) {
            if (x === '' || x === null || x === undefined || x === NaN) {
                return false;
            }
            return true;
        };
        /**
         * determines whether specified item is in an array
         *
         * @param {array} arr - array to check
         * @param {string} item - to check for
         * @return {boolean} true if item is in the array, else false
         */
        function isItemInArray(arr, item) {
            var i,
                iMax = arr.length;
            for (i = 0; i < iMax; i++) {
                if (arr[i] === item) {
                    return true;
                }
            }
            return false;
        };
        /**
         * get a copy of (rather than reference to) an object
         *
         * @param  {object} obj - the object you want a copy
         * @return {object} the copy
         */
        function copyObj(obj) {
            if (isDefined(obj)) {
                return JSON.parse(JSON.stringify(obj));
            }
            return null;
        };
        /**
         * find index of an object in array of objects
         * based on some property value
         * generally useful for finding a unique object
         *
         * @param {array} targetArray - array to search
         * @param {string} objProperty - object property to search
         * @param {string|number} value - value of the property to search for
         * @return {integer} index of first instance if found, otherwise returns -1
         */
        function findObjectInArray(targetArray, objProperty, value) {
            var i, totalItems = targetArray.length,
                objFound = false;
            for (i = 0; i < totalItems; i++) {
                if (targetArray[i][objProperty] === value) {
                    objFound = true;
                    return i;
                }
            }
            if (objFound === false) {
                return -1;
            }
        };
        /**
         * find indexes of a set of object in array of objects
         * based on some property value
         * generally useful for finding several objects
         *
         * @param {array} targetArray - array to search
         * @param {string} objProperty - object property to search
         * @param {string|number} value - value of the property to search for
         * @return {array} array of indexes for matching objects
         */
        function findObjectsInArray(targetArray, objProperty, value) {
            var i, totalItems = targetArray.length,
                newArr = [];
            for (i = 0; i < totalItems; i++) {
                if (targetArray[i][objProperty] === value) {
                    newArr.push(i);
                }
            }
            return newArr;
        };
        /**
         * get a subset of objects in array of objects
         * based on some property value
         *
         * @param {array} targetArray - array to search
         * @param {string} objProperty - object property to search
         * @param {string|number} value - value of the property to search for
         * @return {array} array of objects with matching property value
         */
        function getSubArray(targetArray, objProperty, value) {
            var i, totalItems = targetArray.length,
                idxArr = [];
            for (i = 0; i < totalItems; i++) {
                if (targetArray[i][objProperty] === value) {
                    idxArr.push(targetArray[i]);
                }
            }
            return idxArr;
        };
        /**
         * sort an array of objects based on an object property
         *
         * @param {array} targetArray - array to sort
         * @param {string} objProperty - property whose value to sort on
         * @return {array} the sorted array
         */
        function sortArray(targetArray, objProperty) {
            targetArray.sort(function (a, b) {
                var propA = a[objProperty].toLowerCase(),
                    propB = b[objProperty].toLowerCase();
                // sort ascending; reverse propA and propB to sort descending
                if (propA < propB) {
                    return -1;
                } else if (propA > propB) {
                    return 1;
                }
                return 0;
            });
            return targetArray;
        };
        /**
         * create an element
         *
         * @param  {string} type - the element type
         * @param  {object} attributes - attributes to add to the element
         * @return {object} the HTML element
         */
        function createEl(type, attributes) {
            var el;
            if (isDefined(type)) {
                el = doc.createElement(type);
                if (isDefined(attributes)) {
                    var attr;
                    for (attr in attributes) {
                        el.setAttribute(attr, attributes[attr]);
                    }
                }
                return el;
            }
        };
        /**
         * creates a text node and adds it to an element
         * @param {object|node} el - the node (element) to add the text to
         * @param {string} str - the text to add
         */
        function addText(el, str) {
            var text = doc.createTextNode(str);
            el.appendChild(text);
        };
        /**
         * finds the objects in the doc data for a fileName
         *
         * @param {array} arr - the array of objects to search
         * @param {string} filename - the filename to look for in the meta object
         * @return {array} - array of the objects found
         */
        function findClassObjects(arr, filename) {
            var i, totalItems = arr.length,
                newArr = [];
            for (i = 0; i < totalItems; i++) {
                if (isDefined(arr[i].meta)) {
                    if (arr[i].meta.filename === filename) {
                        newArr.push(arr[i]);
                    }
                }
            }
            return newArr;
        };
        /**
         * add the class header content
         */
        function addHeaderContent(callback) {
            var topSection = createEl('section', {
                id: 'top',
                class: 'section'
            }),
                headerData = doc_data.thisClass.headerInfo,
                header = createEl('h1'),
                extendsNode = createEl('p'),
                extendsLink,
                definedIn = createEl('p'),
                definedInLink = createEl('a', {
                    href: docsPath + classFilePath + '#L' + headerData.meta.lineno
                }),
                description = createEl('div', {
                    style: 'border:none',
                    id: 'classDescription'
                }),
                constructorHeader = createEl('h3'),
                constructorPre = createEl('pre'),
                constructorCode = createEl('code'),
                constructorParamsHeader = createEl('h4'),
                constructorParams = [],
                text;
            // add main content wrapper
            // doc_body.appendChild(mainContent);
            // main = doc.getElementById('main');

            // add elements
            topSection.appendChild(header);
            topSection.appendChild(description);
            // source file
            topSection.appendChild(definedIn);
            addText(definedIn, 'DEFINED IN: ');
            definedIn.appendChild(definedInLink);
            addText(definedInLink, headerData.meta.filename + ' line number: ' + headerData.meta.lineno);
            mainContent.appendChild(topSection);
            // page header
            addText(header, headerData.name);
            // parent info if this class extends another
            if (isDefined(doc_data.parentClasses)) {
                topSection.appendChild(extendsNode);
                addText(extendsNode, 'EXTENDS: ');
                extendsLink = createEl('a', {
                    href: parentClassFilePath + doc_data.parentClasses[0].headerInfo.meta.filename
                });
                extendsNode.appendChild(extendsLink);
                addText(extendsLink, doc_data.parentClasses[0].headerInfo.meta.filename);
            }
            // constructor info - don't add for video.js
            if (doc_data.thisClass.headerInfo.name !== 'videojs') {
                topSection.appendChild(constructorHeader);
                topSection.appendChild(constructorPre);
                constructorPre.appendChild(constructorCode);
                // create the constructor info
                addText(constructorHeader, 'Constructor');
                // get constructor params if any
                if (isDefined(headerData.params)) {
                    var paramTableHeaders = ['name', 'Type', 'Required', 'Description'],
                        paramTable = createEl('table'),
                        paramThead = createEl('thead'),
                        paramTbody = createEl('tbody'),
                        paramTheadRow = createEl('tr'),
                        paramTbodyRow = createEl('tr'),
                        paramTH,
                        paramTD,
                        k,
                        kMax;
                    addText(constructorParamsHeader, 'Parameters');
                    paramTable.appendChild(paramThead);
                    paramTable.appendChild(paramTbody);
                    paramThead.appendChild(paramTheadRow);
                    // set the table headers
                    kMax = paramTableHeaders.length;
                    for (k = 0; k < kMax; k++) {
                        paramTH = createEl('th');
                        paramTheadRow.appendChild(paramTH);
                        addText(paramTH, paramTableHeaders[k]);
                    }
                    // now the table info
                    kMax = headerData.params.length;
                    for (k = 0; k < kMax; k++) {
                        paramTbodyRow = createEl('tr');
                        paramTbody.appendChild(paramTbodyRow);
                        paramTD = createEl('td');
                        addText(paramTD, headerData.params[k].name);
                        paramTbodyRow.appendChild(paramTD);
                        paramTD = createEl('td');
                        addText(paramTD, headerData.params[k].type.names.join('|'));
                        paramTbodyRow.appendChild(paramTD);
                        paramTD = createEl('td');
                        if (headerData.params[k].optional) {
                            text = doc.createTextNode('no');
                            constructorParams.push('[' + headerData.params[k].name + ']');
                        } else {
                            text = doc.createTextNode('yes');
                            constructorParams.push(headerData.params[k].name);
                        }
                        paramTD.appendChild(text);
                        if (isDefined(headerData.params[k].description)) {
                            paramTbodyRow.appendChild(paramTD);
                            paramTD = createEl('td');
                            addText(paramTD, headerData.params[k].description.slice(3, headerData.params[k].description.indexOf('</p>')));
                            paramTbodyRow.appendChild(paramTD);
                        }
                        paramTbody.appendChild(paramTbodyRow);
                    }
                    topSection.appendChild(constructorParamsHeader);
                    topSection.appendChild(paramTable);
                }
            }
            // add constructor params to signature if any
            if (constructorParams.length > 0) {
                text = doc.createTextNode(headerData.name + '( ' + constructorParams.join(',') + ' )');
            } else {
                text = doc.createTextNode(headerData.name + '()');
            }
            constructorCode.appendChild(text);
            addText(description, headerData.description);
            callback();
        };
        /**
         * add the side nav
         */
        function addIndex(callback) {
            var section = createEl('section', {
                id: 'sideNav',
                class: 'side-nav',
                style: 'float:left;max-width: 20%;margin-left:1em;'
            }),
                navHeader = createEl('h2', {
                    class: 'sideNavHeader'
                }),
                navHeaderLink = createEl('a', {
                    href: 'index.html'
                }),
                memberIndex = createEl('div', {
                    id: 'memberIndex',
                    class: 'member-index'
                }),
                thisMember,
                addedMembers = {},
                item,
                thisParent,
                parentList,
                header,
                listItem,
                listLink,
                classHeader,
                parentHeader,
                i,
                iMax,
                j,
                jMax,
                // helper functions
                classHasMembers = function (member) {
                    if (doc_data.thisClass[member].length > 0) {
                        return true;
                    }
                    return false;
                },
                parentsHaveMembers = function () {
                    if (doc_data.parentClasses.length > 0) {
                        for (i = 0; i < doc_data.parentClasses.length; i++) {
                            if (doc_data.parentClasses[i][thisMember].length > 0) {
                                return true;
                            }
                        }
                        return false;
                    }
                },
                makeList = function (classArr, parentArr, member, list) {
                    thisMember = member.toLowerCase();
                    if (classArr.length > 0 || (isDefined(doc_data.parentClass) && parentArr.length > 0)) {
                        // add member list header
                        if (classHasMembers(thisMember) || parentsHaveMembers(thisMember)) {
                            header = createEl('h3');
                            addText(header, doc_data.thisClass.headerInfo.name + ' ' + member);
                        } else {
                            return;
                        }
                        if (classHasMembers(thisMember)) {
                            classHeader = createEl('h4');
                            addText(classHeader, 'Class ' + member);
                            memberIndex.appendChild(header);
                            memberIndex.appendChild(classHeader);
                            // add the list & items
                            list = createEl('ul', {
                                id: list
                            });
                            memberIndex.appendChild(list);
                            iMax = classArr.length;
                            for (i = 0; i < iMax; i++) {
                                item = classArr[i].name;
                                if (!isItemInArray(addedMembers[member], item)) {
                                    // keep track of added members to remove overridden ones
                                    addedMembers[member].push(item);
                                    listItem = createEl('li');
                                    listLink = createEl('a', {
                                        href: '#' + member + item
                                    });
                                    addText(listLink, item);
                                    listItem.appendChild(listLink);
                                    list.appendChild(listItem);
                                }
                            }
                        }
                        // add inherited items if any
                        if (isDefined(parentArr) && parentArr.length > 0) {
                            jMax = parentArr.length;
                            for (j = 0; j < jMax; j++) {
                                thisParent = parentArr[j];
                                if (thisParent[thisMember].length > 0) {
                                    parentHeader = createEl('h4');
                                    addText(parentHeader, 'Inherited ' + member + ' from ' + thisParent.headerInfo.name);
                                    memberIndex.appendChild(parentHeader);
                                    parentList = createEl('ul');
                                    memberIndex.appendChild(parentList);
                                    iMax = thisParent[thisMember].length;
                                    for (i = 0; i < iMax; i++) {
                                        item = thisParent[thisMember][i].name;
                                        if (!isItemInArray(addedMembers[member], item)) {
                                            addedMembers[member].push(item);
                                            listItem = createEl('li');
                                            listLink = createEl('a', {
                                                href: '#' + member + item
                                            });
                                            listItem.appendChild(listLink);
                                            addText(listLink, item);
                                            parentList.appendChild(listItem);
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            // data structure to track members already added
            addedMembers.Methods = [];
            addedMembers.Properties = [];
            addedMembers.Events = [];
            navHeader.appendChild(navHeaderLink);
            addText(navHeaderLink, 'API Index');
            // add parent class members if any
            if (isDefined(doc_data.parentClasses)) {
                makeList(doc_data.thisClass.properties, doc_data.parentClasses, 'Properties', 'propertiesList');
                makeList(doc_data.thisClass.methods, doc_data.parentClasses, 'Methods', 'methodsList');
                makeList(doc_data.thisClass.events, doc_data.parentClasses, 'Events', 'eventsList');
            } else {
                makeList(doc_data.thisClass.properties, [], 'Properties', 'propertiesList');
                makeList(doc_data.thisClass.methods, [], 'Methods', 'methodsList');
                makeList(doc_data.thisClass.events, [], 'Events', 'eventsList');
            }
            section.appendChild(navHeader);
            section.appendChild(memberIndex);
            inPageNav.appendChild(section);
            callback();
        };
        /**
         * add the member content
         * @param {function} callback - function to call when done
         */
        function addMembersContent(callback) {
            var members = [{
                name: 'Properties',
                data: 'properties'
            }, {
                name: 'Methods',
                data: 'methods'
            }, {
                name: 'Events',
                data: 'events'
            }],
                member,
                addedMembers = {},
                section,
                header,
                headerSuffix,
                item,
                itemWrapper,
                itemHeader,
                itemHeaderStr,
                itemParams = [],
                itemParamsHeader,
                itemDescription,
                itemFooter,
                itemFooterLink,
                itemFooterContent,
                paramTable,
                paramThead,
                paramTbody,
                paramTheadRow,
                paramTbodyRow,
                paramTH,
                paramTD,
                paramTableHeaders = ['name', 'Type', 'Required', 'Description'],
                text,
                i,
                iMax,
                j,
                jMax,
                k,
                kMax,
                m,
                mMax,
                topLinkP,
                topLinkA,
                // helper function
                createMemberItem = function (classData, member) {
                    // create the class member items
                    jMax = classData[member.data].length;
                    for (j = 0; j < jMax; j++) {
                        item = classData[member.data][j];
                        if (!isItemInArray(addedMembers[member.name], item.name)) {
                            addedMembers[member.name].push(item.name);
                            itemWrapper = createEl('div', {
                                id: member.name + item.name
                            });
                            section.appendChild(itemWrapper);
                            itemHeader = createEl('h3', {
                                id: item.name + 'Header'
                            });
                            itemHeaderStr = item.name;
                            itemWrapper.appendChild(itemHeader);
                            itemDescription = createEl('div', {
                                id: item.name + 'Description',
                                class: 'description'
                            });
                            itemWrapper.appendChild(itemDescription);
                            itemFooter = createEl('p', {
                                class: 'vjs-only'
                            });
                            itemFooterLink = createEl('a', {
                                href: docsPath + item.meta.filename + '#L' + item.meta.lineno
                            });
                            itemFooterContent = createEl('em', {
                                id: item.name + 'Footer'
                            });
                            itemFooter.appendChild(itemFooterContent);
                            topLinkP = createEl('p');
                            topLinkA = createEl('a', {
                                href: '#top'
                            });
                            addText(topLinkA, '[back to top]');
                            topLinkP.appendChild(topLinkA);
                            // for methods only handle params if any
                            if (member.name === 'Methods' && isDefined(item.params)) {
                                itemParams = [];
                                itemParamsHeader = createEl('h4');
                                addText(itemParamsHeader, 'Parameters');
                                paramTable = createEl('table');
                                paramThead = createEl('thead');
                                paramTbody = createEl('tbody');
                                paramTable.appendChild(paramThead);
                                paramTable.appendChild(paramTbody);
                                paramTheadRow = createEl('tr');
                                paramThead.appendChild(paramTheadRow);
                                // set the table headers
                                kMax = paramTableHeaders.length;
                                for (k = 0; k < kMax; k++) {
                                    paramTH = createEl('th');
                                    paramTheadRow.appendChild(paramTH);
                                    addText(paramTH, paramTableHeaders[k]);
                                }
                                // now the table info
                                kMax = item.params.length;
                                for (k = 0; k < kMax; k++) {
                                    paramTbodyRow = createEl('tr');
                                    paramTbody.appendChild(paramTbodyRow);
                                    paramTD = createEl('td');
                                    addText(paramTD, item.params[k].name);
                                    paramTbodyRow.appendChild(paramTD);
                                    paramTD = createEl('td');
                                    addText(paramTD, item.params[k].type.names.join('|'));
                                    paramTbodyRow.appendChild(paramTD);
                                    paramTD = createEl('td');
                                    if (item.params[k].optional) {
                                        text = doc.createTextNode('no');
                                        itemParams.push('[' + item.params[k].name + ']');
                                    } else {
                                        text = doc.createTextNode('yes');
                                        itemParams.push(item.params[k].name);
                                    }
                                    paramTD.appendChild(text);
                                    if (isDefined(item.params[k].description)) {
                                        paramTbodyRow.appendChild(paramTD);
                                        paramTD = createEl('td');
                                        addText(paramTD, item.params[k].description.slice(3, item.params[k].description.indexOf('</p>')));
                                        paramTbodyRow.appendChild(paramTD);
                                    }
                                    paramTbody.appendChild(paramTbodyRow);
                                }
                                itemHeaderStr += '( ' + itemParams.join(', ') + ' )';
                                if (item.scope === 'static') {
                                    itemHeaderStr = 'static ' + itemHeaderStr;
                                }
                                itemWrapper.appendChild(itemParamsHeader);
                                itemWrapper.appendChild(paramTable);
                            } else if (member.name === 'Methods') {
                                itemHeaderStr += '()';
                            }
                            itemWrapper.appendChild(itemFooter);
                            itemWrapper.appendChild(topLinkP);
                            addText(itemHeader, itemHeaderStr);
                            if (isDefined(item.deprecated)) {
                                headerSuffix = createEl('em', {
                                    class: 'deprecated'
                                });
                                text = doc.createTextNode();
                                addText(headerSuffix, ' (deprecated)');
                                itemHeader.appendChild(headerSuffix);
                            }
                            addText(itemDescription, item.description);
                            addText(itemFooterContent, 'Defined in ');
                            itemFooterContent.appendChild(itemFooterLink);
                            addText(itemFooterLink, 'src/js/' + item.meta.filename + ' line number: ' + item.meta.lineno);
                        }
                    }
                };
           // data structure to track members already added
            addedMembers.Methods = [];
            addedMembers.Properties = [];
            addedMembers.Events = [];
            iMax = members.length;
            for (i = 0; i < iMax; i++) {
                member = members[i];
                if (doc_data.thisClass[member.data].length > 0) {
                    // create the member section
                    section = createEl('section', {
                        id: member.name.toLowerCase(),
                        class: 'section'
                    });
                    mainContent.appendChild(section);
                    header = createEl('h2');
                    addText(header, member.name);
                    section.appendChild(header);
                    // create the member items
                    createMemberItem(doc_data.thisClass, member);
                    if (isDefined(doc_data.parentClasses)) {
                        mMax = doc_data.parentClasses.length;
                        for (m = 0; m < mMax; m++) {
                            if (doc_data.parentClasses[m][member.data].length > 0) {
                                createMemberItem(doc_data.parentClasses[m], member);
                            }
                        }
                    }
                }
            }
            callback();
        };
        /**
         * gets things going
         * @param {string} docFileName - name of the HTML doc we're building
         * @param {function} callback - function to call when done
         */
        function contentInit(docFileName, callback) {
            var fileName,
                parent_class_name,
                privateItems = [],
                srcFileName,
                idx,
                text,
                j,
                parentCounter = 0,
                // helper function to get the chain of parent classes
                getAncestorData = function (parent_class) {
                    // get data objects for the class
                    classes.parentClasses[parentCounter] = findClassObjects(docData, parent_class + '.js');
                    // check to see if there are any parent class items
                    if (classes.parentClasses[parentCounter].length > 0) {
                        doc_data.parentClasses[parentCounter] = {};
                        // get parent header info
                        idx = findObjectInArray(classes.parentClasses[parentCounter], 'kind', 'class');
                        doc_data.parentClasses[parentCounter].headerInfo = copyObj(classes.parentClasses[parentCounter][idx]);
                        // get parent class path
                        idx = findObjectInArray(classes.parentClasses[parentCounter], 'kind', 'file');
                        if (idx > -1) {
                            parentClassFilePath = classes.parentClasses[parentCounter][idx].name;
                        } else {
                            parentClassFilePath = doc_data.parentClasses[parentCounter].headerInfo.meta.filename;
                        }
                        // remove any private items
                        privateItems = findObjectsInArray(classes.parentClasses[parentCounter], 'access', 'private');
                        j = privateItems.length;
                        while (j > 0) {
                            j--;
                            classes.parentClasses[parentCounter].splice(privateItems[j], 1);
                        }
                        // now get the member arrays
                        doc_data.parentClasses[parentCounter].methods = getSubArray(classes.parentClasses[parentCounter], 'kind', 'function');
                        doc_data.parentClasses[parentCounter].methods = sortArray(doc_data.parentClasses[parentCounter].methods, 'name');
                        doc_data.parentClasses[parentCounter].events = getSubArray(classes.parentClasses[parentCounter], 'kind', 'event');
                        doc_data.parentClasses[parentCounter].events = sortArray(doc_data.parentClasses[parentCounter].events, 'name');
                        doc_data.parentClasses[parentCounter].properties = getSubArray(classes.parentClasses[parentCounter], 'kind', 'property');
                        doc_data.parentClasses[parentCounter].properties = sortArray(doc_data.parentClasses[parentCounter].properties, 'name');
                    }
                    // get parent class, if any, and anything it inherits
                    if (isDefined(doc_data.parentClasses[parentCounter].headerInfo.augments)) {
                        idx = findObjectInArray(docData, 'name', doc_data.parentClasses[parentCounter].headerInfo.augments[0]);
                        parent_class_name = docData[idx].meta.filename.replace('.js', '');
                        parentCounter++;
                        getAncestorData(parent_class_name);
                    }
                };
            // get refenence to doc body and title
            doc_body = doc.getElementsByTagName('body')[0];
            title = doc.getElementsByTagName('title')[0];
            // content wrapper
            mainContent = doc.getElementById('main');
			inPageNav = doc.getElementById('inPageNav');
            // src file is the js file of the same name
            srcFileName = docFileName.replace('.html', '.js')
            // video.js is a special case - all others will be the same
            if (srcFileName === 'video.js') {
                // for doc purposes, treat video like a class, though it's not
                // get the data objects for this class
                classes.thisClass = findClassObjects(docData, srcFileName);
                idx = findObjectInArray(classes.thisClass, 'name', 'videojs');
                doc_data.thisClass = {};
                // get the class overview object
                doc_data.thisClass.headerInfo = copyObj(classes.thisClass[idx]);
                doc_data.thisClass.headerInfo.name = 'videojs';
                idx = findObjectInArray(classes.thisClass, 'kind', 'file');
                if (idx > -1) {
                    classFilePath = classes.thisClass[idx].name;
                } else {
                    classFilePath = doc_data.thisClass.headerInfo.meta.filename;
                }
                // set the doc title
                text = doc.createTextNode(doc_data.thisClass.headerInfo.name);
                title.appendChild(text);
                // remove any private items
                privateItems = findObjectsInArray(classes.thisClass, 'access', 'private');
                j = privateItems.length;
                while (j > 0) {
                    j--;
                    classes.thisClass.splice(privateItems[j], 1);
                }
                // now get the member arrays
                doc_data.thisClass.methods = getSubArray(classes.thisClass, 'kind', 'function');
                doc_data.thisClass.methods = sortArray(doc_data.thisClass.methods, 'name');
                doc_data.thisClass.events = getSubArray(classes.thisClass, 'kind', 'event');
                doc_data.thisClass.events = sortArray(doc_data.thisClass.events, 'name');
                doc_data.thisClass.properties = getSubArray(classes.thisClass, 'kind', 'property');
                doc_data.thisClass.properties = sortArray(doc_data.thisClass.properties, 'name');
            } else {
                // get the data objects for this class
                classes.thisClass = findClassObjects(docData, srcFileName);
                idx = findObjectInArray(classes.thisClass, 'kind', 'class');
                doc_data.thisClass = {};
                doc_data.thisClass.headerInfo = copyObj(classes.thisClass[idx]);
                // get the file path from @file object
                idx = findObjectInArray(classes.thisClass, 'kind', 'file');
                if (idx > -1) {
                    classFilePath = classes.thisClass[idx].name;
                } else {
                    classFilePath = doc_data.thisClass.headerInfo.meta.filename;
                }
                // set the doc title
                text = doc.createTextNode(doc_data.thisClass.headerInfo.name);
                title.appendChild(text);
                // remove any private items
                privateItems = findObjectsInArray(classes.thisClass, 'access', 'private');
                j = privateItems.length;
                while (j > 0) {
                    j--;
                    classes.thisClass.splice(privateItems[j], 1);
                }
                // now get the member arrays
                doc_data.thisClass.methods = getSubArray(classes.thisClass, 'kind', 'function');
                doc_data.thisClass.methods = sortArray(doc_data.thisClass.methods, 'name');
                doc_data.thisClass.events = getSubArray(classes.thisClass, 'kind', 'event');
                doc_data.thisClass.events = sortArray(doc_data.thisClass.events, 'name');
                doc_data.thisClass.properties = getSubArray(classes.thisClass, 'kind', 'property');
                doc_data.thisClass.properties = sortArray(doc_data.thisClass.properties, 'name');
                // get parent class, if any, and anything it inherits
                if (isDefined(doc_data.thisClass.headerInfo.augments)) {
                    doc_data.parentClass = {};
                    doc_data.parentClasses = [];
                    classes.parentClasses = [];
                    idx = findObjectInArray(docData, 'name', doc_data.thisClass.headerInfo.augments[0]);
                    parent_class_name = docData[idx].meta.filename.replace('.js', '');
                    getAncestorData(parent_class_name);
                }
            }
            // console.log(doc_data);
            // now we're ready to roll
            addIndex(function () {
                addHeaderContent(function () {
                    addMembersContent(function () {
                        // add scripts and footer block
                        var footer = createEl('div', {'class': 'footer text-center'}),
                            footerLink = createEl('a', {'id': 'feedbackMail', 'href': 'mailto:docs@brightcove.com'}),
                            text = doc.createTextNode('Questions or comments?'),
                            footerScript = createEl('script'),
                            scriptText = doc.createTextNode('var feedbackMail = document.getElementById("feedbackMail");feedbackMail.setAttribute("href", "mailto:docs@brightcove.com?subject=question regarding " + encodeURI(document.location.href));'),
                            scriptEl;
                            footer.appendChild(footerLink);
                            footerLink.appendChild(text);
                            footerScript.appendChild(scriptText);
                            doc_body.appendChild(footer);
                            doc_body.appendChild(footerScript);
                            scriptEl = createEl('script', {'src': '//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js'});
                            addText(scriptEl, '//comment \n');
                            doc_body.appendChild(scriptEl);
                            scriptEl = createEl('script', {'src': '//cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js'});
                            addText(scriptEl, '//comment \n');
                            doc_body.appendChild(scriptEl);
                            scriptEl = createEl('script', {'src': '//cdnjs.cloudflare.com/ajax/libs/foundation/5.5.2/js/foundation.min.js'});
                            addText(scriptEl, '//comment \n');
                            doc_body.appendChild(scriptEl);
                            scriptEl = createEl('script', {'src': '//cdnjs.cloudflare.com/ajax/libs/fastclick/1.0.6/fastclick.min.js'});
                            addText(scriptEl, '//comment \n');
                            doc_body.appendChild(scriptEl);
                            scriptEl = createEl('script', {'src': '//cdnjs.cloudflare.com/ajax/libs/handlebars.js/3.0.2/handlebars.min.js'});
                            addText(scriptEl, '//comment \n');
                            doc_body.appendChild(scriptEl);
                            scriptEl = createEl('script', {'src': '//cdnjs.cloudflare.com/ajax/libs/highlight.js/8.8.0/highlight.min.js'});
                            addText(scriptEl, '//comment \n');
                            doc_body.appendChild(scriptEl);
                            scriptEl = createEl('script', {'src': '//docs.brightcove.com/en/scripts/docs-nav-data.min.js'});
                            addText(scriptEl, '//comment \n');
                            doc_body.appendChild(scriptEl);
                            scriptEl = createEl('script', {'src': '//docs.brightcove.com/en/scripts/bcls-doc-site-v1.js'});
                            addText(scriptEl, '//comment \n');
                            doc_body.appendChild(scriptEl);
                            scriptEl = createEl('script');
                            scriptText = doc.createTextNode('\n $(document).foundation(); \n');
                            scriptEl.appendChild(scriptText);
                            doc_body.appendChild(scriptEl);
                        // now we're ready to write the file
                        callback();
                    });
                });
            });
        };
    });
    // Default task.
    grunt.registerTask('no-clone', ['shell:generateJSON', 'concat', 'uglify', 'createFiles']);
    grunt.registerTask('default', ['shell:cloneVideoJS', 'no-clone']);
}
