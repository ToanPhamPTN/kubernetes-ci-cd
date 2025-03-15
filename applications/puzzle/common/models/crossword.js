'use strict';

module.exports = function (Crossword) {
    Crossword.get = function (cb) {
        Crossword.find({}, (err, data) => {
            if (err) return cb(err);
            cb(null, data);
        });
    };

    Crossword.remoteMethod("get", {
        http: { path: "/", verb: "get" },
        returns: { type: "array", root: true },
        description: "This returns the crossword puzzle from database",
    });

    Crossword.put = function (words, cb) {
        Crossword.create({ words }, (err, result) => {
            if (err) return cb(err);
            cb(null, result);
        });
    };

    Crossword.remoteMethod("put", {
        http: { path: "/", verb: "put" },
        accepts: [{ arg: "words", type: "array", http: { source: "body" } }],
        returns: { type: "object", root: true },
        description: "This updates the backend data store with new crossword values",
    });

    Crossword.clear = function (cb) {
        Crossword.destroyAll({}, (err) => {
            if (err) return cb(err);
            cb(null, { message: "All crossword data cleared" });
        });
    };

    Crossword.remoteMethod("clear", {
        http: { path: "/clear", verb: "put" },
        returns: { type: "object", root: true },
        description: "This clears all crossword puzzle data from the database",
    });
};
