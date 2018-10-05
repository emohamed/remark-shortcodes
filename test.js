"use strict";

/* `remark-shortcodes` tests
   The offical remark tests use the tape harness, so we do too.
*/

var test = require("tape");
var remark = require("remark");
var shortcodes = require("./index.js");

/**
 * Tests whether given markdown is rendered to correct markdown AST and vice versa
 * @param {tape} t - the tape test harness object.
 * @param {string} inputMarkdown - denormalized input text.
 * @param {string} outputMarkdown - normalized output text.
 * @param {string} ast - the AST expected from the md.
 */
function tester(t, pluginOptions, inputMarkdown, outputMarkdown, ast) {
  var tree1 = remark()
    .use(shortcodes, pluginOptions)
    .data("settings", { pedantic: true, position: false })
    .parse(inputMarkdown);
  t.deepEqual(
    tree1,
    ast,
    "ast should be parsed correctly from denormalized markdown"
  );

  var tree2 = remark()
    .use(shortcodes, pluginOptions)
    .data("settings", { pedantic: true, position: false })
    .parse(outputMarkdown);
  t.deepEqual(
    tree2,
    ast,
    "ast should be parsed correctly from normalized markdown"
  );

  var string = remark()
    .use(shortcodes, pluginOptions)
    .data("settings", { pedantic: true, position: false })
    .stringify(ast);
  t.is(
    string,
    outputMarkdown,
    "normalized markdown should be generated from ast"
  );
}

test("test block level shortcode without attributes", function(t) {
  var inputMarkdown = "Drum and Bass\n\n[[ Youtube ]]";
  var outputMarkdown = "Drum and Bass\n\n[[ Youtube ]]\n";
  var ast = {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [{ type: "text", value: "Drum and Bass" }]
      },
      {
        type: "shortcode",
        identifier: "Youtube",
        attributes: {}
      }
    ]
  };
  tester(t, {}, inputMarkdown, outputMarkdown, ast);
  t.end();
});

test("test block level shortcode with attributes", function(t) {
  var inputMarkdown =
    'Drum and Bass\n\n[[ Youtube id=3 share_code="abc" share-code="def" ]]\n\nTest sentence';
  var outputMarkdown =
    'Drum and Bass\n\n[[ Youtube id="3" share_code="abc" share-code="def" ]]\n\nTest sentence\n';
  var ast = {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [{ type: "text", value: "Drum and Bass" }]
      },
      {
        type: "shortcode",
        identifier: "Youtube",
        attributes: { id: "3", share_code: "abc", "share-code": "def" }
      },
      {
        type: "paragraph",
        children: [{ type: "text", value: "Test sentence" }]
      }
    ]
  };
  tester(t, {}, inputMarkdown, outputMarkdown, ast);
  t.end();
});

test("test block level shortcode with custom start/end blocks", function(t) {
  var inputMarkdown =
    'Drum and Bass\n\n{{% Youtube id=3 share-code="abc" %}}\n\nTest sentence';
  var outputMarkdown =
    'Drum and Bass\n\n{{% Youtube id="3" share-code="abc" %}}\n\nTest sentence\n';
  var ast = {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [{ type: "text", value: "Drum and Bass" }]
      },
      {
        type: "shortcode",
        identifier: "Youtube",
        attributes: { id: "3", "share-code": "abc" }
      },
      {
        type: "paragraph",
        children: [{ type: "text", value: "Test sentence" }]
      }
    ]
  };
  tester(
    t,
    { startBlock: "{{%", endBlock: "%}}" },
    inputMarkdown,
    outputMarkdown,
    ast
  );
  t.end();
});

test("test multiple block level shortcodes", function(t) {
  var inputMarkdown =
    '[[ Youtube id=3 ]]\n\nDrum and Bass\n\n[[ Vimeo id="4" ]]';
  var outputMarkdown =
    '[[ Youtube id="3" ]]\n\nDrum and Bass\n\n[[ Vimeo id="4" ]]\n';
  var ast = {
    type: "root",
    children: [
      {
        type: "shortcode",
        identifier: "Youtube",
        attributes: { id: "3" }
      },
      {
        type: "paragraph",
        children: [{ type: "text", value: "Drum and Bass" }]
      },
      {
        type: "shortcode",
        identifier: "Vimeo",
        attributes: { id: "4" }
      }
    ]
  };
  tester(t, {}, inputMarkdown, outputMarkdown, ast);
  t.end();
});

test("test attributes with equals in value", function(t) {
  var inputMarkdown =
    'Drum and Bass\n\n[[ Youtube href="https://youtube.com?q=test" ]]';
  var outputMarkdown =
    'Drum and Bass\n\n[[ Youtube href="https://youtube.com?q=test" ]]\n';
  var ast = {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [{ type: "text", value: "Drum and Bass" }]
      },
      {
        type: "shortcode",
        identifier: "Youtube",
        attributes: { href: "https://youtube.com?q=test" }
      }
    ]
  };
  tester(t, {}, inputMarkdown, outputMarkdown, ast);
  t.end();
});

test("test inline shortcodes", function(t) {
  var inputMarkdown =
    'Drum and Bass [[ Youtube href="https://youtube.com?q=test" ]]';
  var outputMarkdown =
    'Drum and Bass [[ Youtube href="https://youtube.com?q=test" ]]\n';
  var ast = {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          { type: "text", value: "Drum and Bass " },
          {
            type: "shortcode",
            identifier: "Youtube",
            attributes: { href: "https://youtube.com?q=test" }
          }
        ]
      }
    ]
  };
  tester(t, {}, inputMarkdown, outputMarkdown, ast);
  t.end();
});

test("test inline shortcodes with brackets", function(t) {
  var inputMarkdown =
    'Drum and Bass [ youtube href="https://youtube.com?q=test" ]';
  var outputMarkdown =
    'Drum and Bass [ youtube href="https://youtube.com?q=test" ]\n';
  var ast = {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          { type: "text", value: "Drum and Bass " },
          {
            type: "shortcode",
            identifier: "youtube",
            attributes: { href: "https://youtube.com?q=test" }
          }
        ]
      }
    ]
  };
  tester(t, {startBlock: '[', endBlock: ']'}, inputMarkdown, outputMarkdown, ast);
  t.end();
});

test("test inline shortcodes with brackets without spaces", function(t) {
  var inputMarkdown =
    'Drum and Bass [youtube href="https://youtube.com?q=test"]';
  var outputMarkdown =
    'Drum and Bass [ youtube href="https://youtube.com?q=test" ]\n';
  var ast = {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          { type: "text", value: "Drum and Bass " },
          {
            type: "shortcode",
            identifier: "youtube",
            attributes: { href: "https://youtube.com?q=test" }
          }
        ]
      }
    ]
  };
  tester(t, {startBlock: '[', endBlock: ']'}, inputMarkdown, outputMarkdown, ast);
  t.end();
});

test("test that shortcodes with brackets are not breaking links", function(t) {
  var inputMarkdown =
    'Drum and [Bass](http://google.com) [youtube href="https://youtube.com?q=test"]';

  var outputMarkdown =
    'Drum and [Bass](http://google.com) [ youtube href="https://youtube.com?q=test" ]\n';
  var ast = {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          {
             "type":"text",
             "value":"Drum and "
          },

          {
             "type":"link",
             "title":null,
             "url":"http://google.com",
             "children":[
                {
                   "type":"text",
                   "value":"Bass"
                }
             ]
          },

          {
             "type":"text",
             "value":" "
          },

          {
            type: "shortcode",
            identifier: "youtube",
            attributes: { href: "https://youtube.com?q=test" }
          }

        ]
      }
    ]
  };
  tester(t, {startBlock: '[', endBlock: ']', captureOnly: ['youtube']}, inputMarkdown, outputMarkdown, ast);
  t.end();

});


test("shortcodes are not parsed when they're found in code blocks", function(t) {
  var inputMarkdown =
    'Drum and `[Bass](http://google.com) [youtube href="https://youtube.com?q=test"]`';

  var outputMarkdown =
    'Drum and `[Bass](http://google.com) [youtube href="https://youtube.com?q=test"]`\n';

  var ast = {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          {
             "type":"text",
             "value":"Drum and "
          },

          {
            type: "inlineCode",
            value: '[Bass](http://google.com) [youtube href="https://youtube.com?q=test"]'
          }
        ]
      }
    ]
  };
  tester(t, {startBlock: '[', endBlock: ']', captureOnly: ['youtube']}, inputMarkdown, outputMarkdown, ast);
  t.end();

});
