'use strict';
var find = require('lodash.find');
var map = require('lodash.map');
var htmlParser = require('htmlparser2');
var ProcessingInstructions = require('./processing-instructions');
var IsValidNodeDefinitions = require('./is-valid-node-definitions');

var Html2React = function(React, options) {
    var parseHtmlToTree = function(html) {
        var handler = new htmlParser.DomHandler();
        var parser = new htmlParser.Parser(handler, options);
        parser.parseComplete(html);
        return handler.dom;
    };

    var traverseDom = function(node, isValidNode, processingInstructions, index) {
        if (isValidNode(node)) {
            var processingInstruction = find(processingInstructions || [],
                function (processingInstruction) {
                    return processingInstruction.shouldProcessNode(node);
                });
            if (processingInstruction != null) {
                var children = map(node.children || [], function (child, i) {
                    return traverseDom(child, isValidNode, processingInstructions, i);
                }).filter(function (x) {
                    return x != null;
                });
                return processingInstruction.processNode(node, children, index);
            } else {
                return false;
            }
        } else {
            return false;
        }
    };

    var parseWithInstructions = function(html, isValidNode, processingInstructions) {
        var domTree = parseHtmlToTree(html);
        if (domTree && domTree.length !== 1) {
            throw new Error(
                'html-to-react currently only supports HTML with one single root element. ' +
                'The HTML provided contains ' + domTree.length +
                ' root elements. You can fix that by simply wrapping your HTML ' +
                'in a <div> element.');
        }
        return traverseDom(domTree[0], isValidNode, processingInstructions, 0);
    };

    var parseDomTreeWithInstructions = function(domTree, isValidNode, processingInstructions) {
        if (domTree && domTree.length !== 1) {
            throw new Error(
                'html-to-react currently only supports HTML with one single root element. ' +
                'The HTML provided contains ' + domTree.length +
                ' root elements. You can fix that by simply wrapping your HTML ' +
                'in a <div> element.');
        }
        return traverseDom(domTree[0], isValidNode, processingInstructions, 0);
    };

    var parse = function(html) {
        var processingInstructions = new ProcessingInstructions(React);
        return parseWithInstructions(html,
            IsValidNodeDefinitions.alwaysValid,
            processingInstructions.defaultProcessingInstructions);
    };

    return {
        parse: parse,
        parseHtmlToTree: parseHtmlToTree,
        parseWithInstructions: parseWithInstructions,
        parseDomTreeWithInstructions: parseDomTreeWithInstructions,
    };
};

module.exports = Html2React;
