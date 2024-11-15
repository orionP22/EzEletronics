import db from "../db/db"
import { Product } from "../components/product"
import crypto from "crypto"
import { ProductAlreadyExistsError, InvalidArrivalDateError, ProductNotFoundError, LowProductStockError, EmptyProductStockError } from "../errors/productError";
import { ok } from "assert";
/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {
    registerProducts(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            //console.log("ok")
            try {

                if (arrivalDate && new Date(arrivalDate) > new Date() /*|| isNaN(new Date(arrivalDate).getTime())*/) {
                    reject(new InvalidArrivalDateError());
                    return;
                }
                
                const sql = "INSERT INTO products(model, category, quantity, details, sellingPrice, arrivalDate) VALUES(?, ?, ?, ?, ?, ?)"
                // console.log([model, category, quantity, details, sellingPrice, arrivalDate])
                db.run(sql, [model, category, quantity, details, sellingPrice, arrivalDate], (err: Error | null) => {
                    if (err) {
                        // console.log(err)
                        if (err.message.includes("UNIQUE constraint failed: products.model")) reject(new ProductAlreadyExistsError)
                        reject(new ProductNotFoundError)
                    }
                    resolve() //resolve to nothing?
                })
            } catch (error) {
                reject(new InvalidArrivalDateError)
            }

        })
    }

    changeProductQuantity(model: string, newQuantity: number, changeDate: string | null){
        return new Promise<number>((resolve, reject) => {
            try {
                db.get('SELECT quantity FROM products WHERE model = ?', [model], (err, row:any) => {
                    if (err) {
                        // console.log(err)
                        reject(err)
                        return
                    }
                    if (!row) {
                        return reject(new ProductNotFoundError);
                    }
                const updatedQuantity= row.quantity + newQuantity;
                const sql = "UPDATE products SET quantity = quantity + ? WHERE model = ?"
                db.run(sql, [newQuantity,  model], (err: Error | null) => {
                    if (err) {
                        // console.log(err)
                        reject(err)
                        return
                    }
                    resolve(updatedQuantity) //resolve to quantity?
                    //resolve(true)
                    })
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    sellProduct(model: string, quantity: number, sellingDate: string | null){
        return new Promise<number>((resolve, reject) => {
            try {
                db.get('SELECT quantity FROM products WHERE model = ?', [model], (err, row:any) => {
             
                    if (err) {
                        // console.log(err)
                        reject(err)
                        return
                    }
                    if (!row) {
                        return reject(new ProductNotFoundError);
                    }
                    if(quantity > row.quantity) {
                        return reject(new LowProductStockError);
                    }
                    const updatedQuantity= row.quantity - quantity;
                    const sql = "UPDATE products SET quantity = quantity - ? WHERE model = ?"
                    db.run(sql, [quantity, model], (err: Error | null) => {
                        if (err) {
                            // console.log(err)
                            reject(err)
                            return
                        }
                        resolve(updatedQuantity) //resolve to quantity?
                        //resolve(true)
                        })
                })
            } catch (error) {
                reject(error)
            }

        })
    }

    getAllProducts(): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM products";
                db.all(sql, [], (err: Error | null, rows: any[]) => {
                    if (err) {
                        return reject(err);
                    }
                    const products: Product[] = rows.map((row) => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity));
                    resolve(products);
                });
            } catch (error) {
                reject(error);
            }
        })
    }

    getProductByCategory(category: string): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM products where category = ?";
                db.all(sql, [category], (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const products: Product[] = rows.map((row) => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity));
                    resolve(products);
                });
            } catch (error) {
                reject(error);
            }
        })
    }

    getProductByModel(model: string): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM products where model = ?";
                db.all(sql, [model], (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if(!rows || rows.length === 0 /*Ho aggiunto questo*/) {return reject(new ProductNotFoundError); }
                    const products: Product[] = rows.map((row) => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity));
                    resolve(products);
                });
            } catch (error) {
                reject(error);
            }
        })
    }

    getAvailableProducts(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM products where quantity > 0";
                db.all(sql,[], (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const products: Product[] = rows.map((row) => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity));
                    resolve(products);
                });
            } catch (error) {
                reject(error);
            }
        })
    }

    getAvailableProductByCategory(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM products where category = ? AND quantity > 0";
                db.all(sql, [category], (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const products: Product[] = rows.map((row) => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity));
                    resolve(products);
                });
            } catch (error) {
                reject(error);
            }
        })
    }

    getAvailableProductByModel(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM products where model= ? AND quantity > 0";
                db.all(sql, [model], (err: Error | null, rows: any[]) => {
                    if (err) {
                        return reject(err);
                    }
                    if(!rows || rows.length == 0 /*Ho aggiunto questo*/) { resolve([]);
                    }
                    const products: Product[] = rows.map((row) => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity));
                    resolve(products);
                });
            } catch (error) {
                reject(error);
            }
        })
    }

    deleteAllProducts(){
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sql = "DELETE FROM products";
                db.run(sql, [], (err: Error | null) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(true);
                });
            } catch (error) {
                reject(error);
            }
        }); 
    }

    deleteProduct(model: string){
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sql = "DELETE FROM products WHERE model = ?";
                db.run(sql, [model], (err: Error | null) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(true);
                });
            } catch (error) {
                reject(error);
            }
        }); 
    }
}

export default ProductDAO