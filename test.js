var Resurrect = require('./resurrect.js')
function foo(args) {
  console.log("function foo is called by args=", args)
  return 'hello'
}
(function () {
  if (typeof Object.prototype.uniqueId == "undefined") {
    var id = 0;
    Object.prototype.uniqueId = function () {
      // if (["string"].includes(typeof o)) {
      this.__uniqueid = ++id;
      // } else {
      //   Object.defineProperty(o, "__uniqueid", {
      //     value: ++id,
      //     enumerable: false,
      //     // This could go either way, depending on your 
      //     // interpretation of what an "id" is
      //     writable: false
      //   });
      // };
      return this.__uniqueid;
    }
  }
})();

var stringData3 = "text data";

var testData = [foo, foo, foo.uniqueId(), stringData3.uniqueId(), stringData3, stringData3, stringData3.uniqueId(), 12345678901234567890, 0.1234567890123456789012, null, void 0, 0.0 / 0.0, 1.0 / 0.0, -1 / 0.0, null];
testData.slice(-1)[0] = [[testData]]; // loop struct
var necromancer = new Resurrect();

// References to the same object are preserved:
var json = necromancer.stringify(testData);
var array = necromancer.resurrect(json);
console.log(array)
console.log(array[0]("one") === array[1]("two"))
console.log(array[0].uniqueId(), array[1].uniqueId(), stringData3.uniqueId(), array[3].uniqueId(), array[4].uniqueId())
// console output [2 3 4 5 6] <-- not output [1 1 2 2 2]

// Dates are restored properly
json = necromancer.stringify(new Date());
var date = necromancer.resurrect(json);
console.log(Object.prototype.toString.call(date));  // => "[object Date]"

var regExp1 = (new RegExp(/(?<=\{)([^\}]*)(?=\})/g))
var regExp1_compiled = regExp1.compile(regExp1)
json = necromancer.stringify(regExp1_compiled)
var regExp2 = necromancer.resurrect(json);
var testText = "prefix-{term1}-{vars2}";
try {
  console.log("regExp test", testText.match(regExp2), regExp1_compiled, json)
} catch (err) {
  console.error("At regExp2.match", err)
}

var namespace1 = {};
var namespace2 = {};
namespace1.regExp1 = /(?<=\{)([^\}]*)(?=\})/g
namespace2.regExp2 = namespace1.regExp1
namespace1.Foo = function Foo(paramText) {
  this.bar = true;
  console.log("namespace1.Foo is called with args:", paramText)
  try {
    console.log(paramText.match(namespace2.regExp2))
  } catch (err1) {
    console.error("ERROR in namespace1.Foo:", err1)
  }
  return paramText.match(namespace1.regExp1);
};

var namespaced_necromancer = new Resurrect({
  resolver: new Resurrect.NamespaceResolver(namespace1)
});
// References to namespaced function object are preserved:
json = necromancer.stringify(namespace1.Foo);
var functionObject = necromancer.resurrect(json);
try {
  with (namespace2) {
    var resultDirect = namespace1.Foo(testText)
  }
} catch (err1) {
  console.log("ERROR in calling Direct namespace1.Foo", err1)
}
try {
  with (namespace1) {
    var resultIndirect = functionObject(testText)
  }
} catch (err2) {
  console.log("ERROR in calling indirect functionObject via namespace1.Foo", err2)
}
