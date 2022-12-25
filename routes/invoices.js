/** Routes for invoices. */

const db = require("../db");
const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();

router.get("/", async function (req, res, next) {
    try {
        const results = await db.query(
            `SELECT id, comp_code FROM invoices`);

        return res.json({invoices: results.rows});
    }

    catch (err) {
        return next(err);
    }
});

router.post("/", async function (req, res, next) {
    try {
        const { comp_code, amt } = req.body;
        if(!comp_code || !amt ){
            throw new ExpressError(`Please enter a valid code, name and description`, 400)
        }
        const results = await db.query(
            `INSERT INTO invoices (comp_code, amt) 
             VALUES ($1, $2)
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
          [comp_code, amt]
      );
        return res.json({invoice: results.rows[0]});
    }

    catch (err) {
        return next(err);
    }
});

router.get("/:id", async function (req, res, next) {
    try {
        const { id } = req.params
        const results = await db.query(
            `SELECT * FROM invoices WHERE id='${id}'`);
        if (results.rows.length === 0){
            throw new ExpressError(`Can't find invoice with id of: ${id}`, 404)
        }
        return res.json({invoice: results.rows[0]});
    }

    catch (err) {
        return next(err);
    }
});

router.put("/:id", async function (req, res, next) {
    try {
        const { id } = req.params;
        const {amt} = req.body;
        const results = await db.query(
            `UPDATE invoices SET amt=$1
           WHERE id = $2
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [amt, id]);
        if (results.rows.length === 0){
            throw new ExpressError(`Can't find invoice with id of: ${id}`, 404)
        }
        return res.json({company: results.rows[0]});
    }
    catch (err) {
        return next(err);
    }
});

router.delete("/:id", async function (req, res, next) {
    try {
        const { id } = req.params;
        const results = await db.query(
            `DELETE FROM invoices WHERE id = $1`,
            [id]);
        if(results.rowCount === 0){
            throw new ExpressError(`Could not delete invoice with code: ${id}`, 404);
        }
        return res.json({status: "Deleted"});
    }
    catch (err) {
        return next(err);
    }
});

module.exports = router;