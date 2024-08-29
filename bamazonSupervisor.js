var mysql = require("mysql");
var Table = require('cli-table');
var clear = require('clear');
const chalk = require('chalk');
var figlet = require('figlet');
var inquirer = require("inquirer");
var dotenv = require('dotenv').config();

var connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,

    // Your username
    user: process.env.DB_USER,

    // Your password
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId + "\n");
    clear();
    userOptions();
});


function userOptions() {
    inquirer
        .prompt([
            {
                name: "action",
                type: "list",
                message: "What would you like to do?",
                choices: [
                    {
                        key: 'a',
                        name: 'View Product Sales by Department',
                        value: 'view_product_sales'
                    },
                    {
                        key: 'b',
                        name: 'Create New Department',
                        value: 'create_department'
                    }
                ]
            }
        ])
        .then(function (answer) {
            //console.log(answer);
            if (answer.action === 'view_product_sales') {
                displayProductSales();
            }
            else if (answer.action === 'create_department') {
                createDepartment();
            }
        });
}


function displayProductSales() {
    connection.query("SELECT d.*,sum(p.product_sales) as product_sales, (sum(p.product_sales)-d.over_head_costs) as total_profit FROM departments d left join products p on d.department_name=p.department_name group by d.department_id", function (err, res) {
        if (err) throw err;

        var table = new Table({
            chars: {
                'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗'
                , 'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝'
                , 'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼'
                , 'right': '║', 'right-mid': '╢', 'middle': '│'
            },
            head: ['Department Id', 'Department Name', 'Over Head Costs', 'Product Sales', 'Total Profit']
        });

        for (var i = 0; i < res.length; i++) {
            table.push([res[i].department_id, res[i].department_name, '$'
            + res[i].over_head_costs, '$'
            + res[i].product_sales, '$'
            + res[i].total_profit]);
        }
        console.log("\nProduct Sales by Department");
        console.log(table.toString());
        connection.end();
    });
}


function createDepartment() {
    inquirer
        .prompt([
            {
                name: "department",
                type: "input",
                message: "What is the name of the department you would like to add ?"
            },
            {
                name: "overhead",
                type: "input",
                message: "What is the over head cost of the department?",
                validate: function (value) {
                    var reg = /^\d+$/;
                    return reg.test(value) || "Over Head Cost should be a number!";
                }
            }
        ])
        .then(function (answer) {
            connection.query("INSERT INTO departments SET ?",
                {
                    department_name: answer.department,
                    over_head_cost: answer.overhead
                }
                , function (err, res) {
                    console.log('New department added');
                    connection.end();
                });

        });
}