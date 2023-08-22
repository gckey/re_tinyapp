const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function () {
  it('should return a user with valid email', function () {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    // Write your assert statement here
    console.log(user, expectedUserID);
    assert.deepEqual(user.id, expectedUserID);
  });

  it("should return undefined when passed non-existent email", function () {
    const user = getUserByEmail("test@test.com", testUsers);
    const expectedOutput = undefined;
    console.log(user);
    assert.equal(user, expectedOutput);
  });
});