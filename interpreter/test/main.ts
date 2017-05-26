/*
Obviously this is only an example/dummy file.
*/

it("adds two exclamation marks", () => {
    const API = require("../src/main");

    expect(API.dummy("Hi")).toBe("Hi!!");
});
