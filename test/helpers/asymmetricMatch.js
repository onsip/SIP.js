window.withPrototype = function (expected) {
  return {
    asymmetricMatch: function (actual) {
      var key;
      for (key in expected) {
        if (expected[key] !== actual[key]) return false;
      }
      for (key in actual) {
        if (expected[key] !== actual[key]) return false;
      }
      return true;
    }
  };
};
