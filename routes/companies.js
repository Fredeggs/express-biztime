/** Routes for companies. */

const db = require("../db");
const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();

router.get("/", async function (req, res, next) {
    try {
        const results = await db.query(
            `SELECT code, name FROM companies`);

        return res.json({companies: results.rows});
    }

    catch (err) {
        return next(err);
    }
});

router.post("/", async function (req, res, next) {
    try {
        const { code, name, description } = req.body
        if(!code || !name || !description){
            throw new ExpressError(`Please enter a valid code, name and description`, 400)
        }
        const results = await db.query(
            `INSERT INTO companies (code, name, description) 
             VALUES ($1, $2, $3)
             RETURNING code, name, description`,
          [code, name, description]
      );
        return res.json({company: results.rows[0]});
    }

    catch (err) {
        return next(err);
    }
});

router.get("/:code", async function (req, res, next) {
    try {
        const { code } = req.params
        const results = await db.query(
            `SELECT * FROM companies WHERE code='${code}'`);
        if (results.rows.length === 0){
            throw new ExpressError(`Can't find company with code of: ${code}`, 404)
        }
        return res.json({company: results.rows[0]});
    }

    catch (err) {
        return next(err);
    }
});

router.put("/:code", async function (req, res, next) {
    try {
        const { code } = req.params;
        const {name, description} = req.body;
        const results = await db.query(
            `UPDATE companies SET name=$1, description=$2
           WHERE code = $3
           RETURNING name, description, code`,
        [name, description, code]);
        if (results.rows.length === 0){
            throw new ExpressError(`Can't find company with code of: ${code}`, 404)
        }
        return res.json({company: results.rows[0]});
    }
    catch (err) {
        return next(err);
    }
});

router.delete("/:code", async function (req, res, next) {
    try {
        const { code } = req.params;
        const results = await db.query(
            `DELETE FROM companies WHERE code = $1`,
            [code]);
        if(results.rowCount === 0){
            throw new ExpressError(`Could not delete company with code: ${code}`, 404);
        }
        return res.json({status: "Deleted"});
    }
    catch (err) {
        return next(err);
    }
});

module.exports = router;