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
                        name: 'View Products for Sale',
                        value: 'view_products'
                    },
                    {
                        key: 'b',
                        name: 'View Low Inventory',
                        value: 'view_low'
                    },
                    {
                        key: 'c',
                        name: 'Add to Inventory',
                        value: 'add_inventory'
                    },
                    {
                        key: 'd',
                        name: 'Add New Product',
                        value: 'add_product'
                    }
                ]
            }
        ])
        .then(function (answer) {
            //console.log(answer);

            if (answer.action === 'view_products') {
                displayProducts();
            }
            else if (answer.action === 'view_low') {
                displayLowQuantity();
            }
            else if (answer.action === 'add_inventory') {
                addInventory();
            }
            else if (answer.action === 'add_product') {
                addProduct();
            }

        });
}


function displayProducts() {
    connection.query("SELECT * FROM products", function (err, res) {
        if (err) throw err;

        var table = new Table({
            chars: {
                'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗'
                , 'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝'
                , 'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼'
                , 'right': '║', 'right-mid': '╢', 'middle': '│'
            },
            head: ['Id', 'Name', 'Price', 'Quantity']
        });

        for (var i = 0; i < res.length; i++) {
            table.push([res[i].item_id, res[i].product_name, '$' + res[i].price, res[i].stock_quantity]);
        }
        console.log("\nCurrent Products");
        console.log(table.toString());
        connection.end();
    });
}

function displayLowQuantity() {
    connection.query("SELECT * FROM products where stock_quantity < 5", function (err, res) {
        //console.log(res);

        var table = new Table({
            chars: {
                'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗'
                , 'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝'
                , 'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼'
                , 'right': '║', 'right-mid': '╢', 'middle': '│'
            },
            head: ['Id', 'Name', 'Price', 'Quantity']
        });

        for (var i = 0; i < res.length; i++) {
            table.push([res[i].item_id, res[i].product_name, '$' + res[i].price, res[i].stock_quantity]);
        }
        console.log("\nLow Products");
        console.log(table.toString());
        connection.end();
    });
}

function addInventory() {
    inquirer
        .prompt([
            {
                name: "id",
                type: "input",
                message: "What is the id of the item you would like to add more to?",
                validate: function (value) {
                    var reg = /^\d+$/;
                    return reg.test(value) || "Id should be a number!";
                }
            },
            {
                name: "amount",
                type: "input",
                message: "How many would you like to add?",
                validate: function (value) {
                    var reg = /^\d+$/;
                    return reg.test(value) || "Amount should be a number!";
                },
                default: 1
            }
        ])
        .then(function (answer) {
            connection.query("SELECT * FROM products where ?",
                {
                    item_id: answer.id
                }, function (err, res) {
                    if (err) throw err;
                    //console.log(res);
                    if (typeof res != "undefined" && res != null && res.length > 0) {
                        var newQuantity = res[0].stock_quantity + parseInt(answer.amount);
                        connection.query("UPDATE products set ? where ?",
                            [
                                {
                                    stock_quantity: newQuantity
                                },
                                {
                                    item_id: answer.id
                                }
                            ], function (err, res) {
                                console.log('Added ' + answer.amount);
                            });
                    } else {
                        console.log(answer.id + ' is not a valid id.');

                    }
                    connection.end();
                });
        });
}

function addProduct() {
    inquirer
        .prompt([
            {
                name: "name",
                type: "input",
                message: "What is the name the product you would like to add ?"
            },
            {
                name: "department",
                type: "input",
                message: "What department is this product in?"
            },
            {
                name: "price",
                type: "input",
                message: "What is the price of the product?",
                validate: function (value) {
                    var reg = /^\d+$/;
                    return reg.test(value) || "Price should be a number!";
                }
            },
            {
                name: "quantity",
                type: "input",
                message: "How many of the product is in stock?",
                validate: function (value) {
                    var reg = /^\d+$/;
                    return reg.test(value) || "Quantity should be a number!";
                },
                default: 1
            }
        ])
        .then(function (answer) {
            connection.query("INSERT INTO products SET ?",
                {
                    product_name: answer.name,
                    department_name: answer.department,
                    price: answer.price,
                    stock_quantity: answer.quantity
                }
                , function (err, res) {
                    console.log('New product added');
                    connection.end();
                });

        });
}