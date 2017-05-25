it("adds two exclamation marks", () => {
    const API = require("../src/main");

    expect(API.dummy("Hi")).toBe("Hi!!");
});
