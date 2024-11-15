import { User } from "../components/user";
import {Cart} from "../components/cart";
import { ProductInCart } from "../components/cart";
import db from "../db/db";
import dayjs from "dayjs";
import {ProductNotFoundError, EmptyProductStockError, LowProductStockError} from "../errors/productError";
import {CartNotFoundError, EmptyCartError, ProductNotInCartError, UnprocessableEntity} from "../errors/cartError";

/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {

    getCart(user: User):Promise<Cart>{
        return new Promise<Cart>((resolve, reject) => {
            try{
                const sql = "SELECT id, customer, paid, paymentDate, total FROM carts WHERE customer=? AND paid=?";
                db.get(sql, [user.username, 0], (err: Error | null, row: any) => {
                    if (err) reject(err);
                        let prodsInCart:ProductInCart[] = [];
                    if (!row || row.total==0) { //|| row.products.length===0
                        resolve(new Cart(user.username, false, null, 0, prodsInCart));
                    }else{
                        const idCart = row.id;
                        try{
                            const sql = "SELECT model, category, quantity, price FROM productsInCart WHERE idCart=?";
                            db.all(sql, [idCart], (err: Error | null, rows: any[]) => {
                                if (err) reject(err);
                                prodsInCart = rows.map((prod) => new ProductInCart(prod.model, prod.quantity, prod.category, prod.price));
                                resolve(new Cart(row.customer, row.paid, row.paymentDate, row.total, prodsInCart));
                            });
                        }catch(error){
                            reject(error);
                        }
                    }
                });
            }catch(error){
                reject(error);
            }
        });
    }

    addToCart(user: User, productId: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if(productId==="" || productId==null){
                return reject(new UnprocessableEntity());
            }else{
            //Seleziono i dati del prodotto da aggiungere al carrello corrente
            const getProductSql = "SELECT category, sellingPrice, quantity FROM products WHERE model=?";
            const getProduct = new Promise<any>((resolve, reject) => {
                db.get(getProductSql, [productId], (err, row) => {
                    if (err) return reject(err);
                    if (!row) return reject(new ProductNotFoundError()); //il prodotto non esiste
                    //if (!row) return reject(); //il prodotto non esiste
                    resolve(row);
                });
            });
            getProduct.then(product => {
                // console.log(product);
                if (product.quantity <= 0) {
                    return reject(new EmptyProductStockError()); //stock esaurito
                }
                //controllo che l'utente abbia un carrello corrente
                const getCartSql = "SELECT id, total FROM carts WHERE customer=? AND paid=0";
                const getCart = new Promise<any>((resolve, reject) => {
                    db.get(getCartSql, [user.username], (err, row) => {
                        if (err) return reject(err);
                        // console.log(row);
                        resolve(row);
                    });
                });
                getCart.then(cart => {
                    if (!cart) { //se l'utente non ha un carrello ne creo uno e inserisco il prodotto all'interno
                        const createCartSql = "INSERT INTO carts(customer, paid, paymentDate, total) VALUES(?, ?, ?, ?)";
                        const createCart = new Promise<void>((resolve, reject) => {
                            // console.log(product.sellingPrice);
                            db.run(createCartSql, [user.username, 0, null, product.sellingPrice], err => {
                                if (err) return reject(err);
                                resolve();
                            });
                        });
                        createCart.then(() => {
                            const newCartSql = "SELECT id FROM carts WHERE customer=? AND paid=0";
                            const newCart = new Promise<any>((resolve, reject) => {
                                db.get(newCartSql, [user.username], (err, row) => {
                                    if (err) return reject(err);
                                    resolve(row);
                                });
                            });
                            newCart.then(newCartRow => {
                                const insertProductSql = "INSERT INTO productsInCart(price, model, category, quantity, idCart) VALUES(?, ?, ?, ?, ?)";
                                const insertProduct = new Promise<boolean>((resolve, reject) => {
                                    db.run(insertProductSql, [product.sellingPrice, productId, product.category, 1, newCartRow.id], err => {
                                        if (err) return reject(err);
                                        resolve(true);
                                    });
                                });
                                insertProduct.then(() => resolve(true));
                            });
                        });
                    } else { //l'utente ha un carrello corrente
                        const getProductsInCartSql = "SELECT model, category, quantity, price FROM productsInCart WHERE idCart=?";
                        const getProductsInCart = new Promise<any[]>((resolve, reject) => {
                            db.all(getProductsInCartSql, [cart.id], (err, rows) => {
                                if (err) return reject(err);
                                resolve(rows);
                            });
                        });
                        getProductsInCart.then(products => {
                            const existingProduct = products.find(p => p.model === productId);
                            if (existingProduct) { //se il modello selezionato è già nel carrello, incremento la quantità e aggiorno il totale del carrello
                                const updateProductSql = "UPDATE productsInCart SET quantity=? WHERE model=? AND idCart=?";
                                const updateProduct = new Promise<void>((resolve, reject) => {
                                    db.run(updateProductSql, [existingProduct.quantity + 1, productId, cart.id], err => {
                                        if (err) return reject(err);
                                        resolve();
                                    });
                                });
                                updateProduct.then(() => {
                                    const updateCartTotalSql = "UPDATE carts SET total=? WHERE id=?";
                                    const updateCartTotal = new Promise<boolean>((resolve, reject) => {
                                        db.run(updateCartTotalSql, [cart.total + product.sellingPrice, cart.id], err => {
                                            if (err) return reject(err);
                                            resolve(true);
                                        });
                                    });
                                    updateCartTotal.then(() => resolve(true));
                                });
                            } else { //il modello non è presente nel carrello corrente, inserisco il prodotto e aggiorno il totale del carrello
                                const insertProductSql = "INSERT INTO productsInCart(price, model, category, quantity, idCart) VALUES(?, ?, ?, ?, ?)";
                                const insertProduct = new Promise<void>((resolve, reject) => {
                                    db.run(insertProductSql, [product.sellingPrice, productId, product.category, 1, cart.id], err => {
                                        if (err) return reject(err);
                                        resolve();
                                    });
                                });
                                insertProduct.then(() => {
                                    const updateCartTotalSql = "UPDATE carts SET total=? WHERE id=?";
                                    const updateCartTotal = new Promise<boolean>((resolve, reject) => {
                                        db.run(updateCartTotalSql, [cart.total + product.sellingPrice, cart.id], err => {
                                            if (err) return reject(err);
                                            resolve(true);
                                        });
                                    });
                                    updateCartTotal.then(() => resolve(true));
                                });
                            }
                        });
                    }
                });
            }).catch(err => {
                //console.error(err);
                reject(err);
            });
        }
        });
    }

    checkoutCart(user:User):Promise<Boolean>{
        return new Promise<Boolean>((resolve, reject) => {
            try{
                console.group('ok');
                const sql = "SELECT id, customer, paid, paymentDate, total FROM carts WHERE customer=? AND paid=?";
                db.get(sql, [user.username, 0], (err: Error | null, row: any) => {
                    // console.log(row.id);
                    if(err) reject(err);
                    if(!row){
                        //non esiste un carrello corrente
                        reject(new CartNotFoundError());
                    }else{
                        //esiste un carrello corrente
                        if(row.total==0){
                            //il carrello corrente è vuoto
                            reject(new EmptyCartError());
                        }else{
                            let emptyStock=false;
                            let insuffStock=false;
                            const idCart = row.id;
                            // console.log(idCart);
                            try{
                                const sql = "SELECT pc.model AS model, (p.quantity-pc.quantity) AS diffStock, p.quantity AS avaiableStock FROM productsInCart AS pc, products AS p WHERE pc.idCart=? AND pc.model=p.model";
                                db.all(sql, [idCart], (err: Error | null, rows: any[]) => {
                                    if(err) reject(err);
                                    rows.forEach(row => {
                                        if(row.avaiableStock==0){
                                            // console.log('emptyStock');
                                            reject (new EmptyProductStockError());
                                            emptyStock=true;
                                        }else if(row.diffStock<0){
                                            // console.log('insuffStock');
                                            reject (new LowProductStockError());
                                            insuffStock=true;
                                        }
                                    });
                                    if(emptyStock==false && insuffStock==false){
                                        //registro che il carrello è stato pagato
                                        try{
                                            const sql = "UPDATE carts SET paymentDate = ?, paid = ? WHERE customer = ? AND paid = ?";
                                            db.run(sql, [dayjs().format("YYYY-MM-DD"), 1, user.username, 0], (err: Error | null) => {
                                                if(err) reject(err);
                                            });
                                        }catch(error){
                                            reject(error);
                                        }
                                        rows.forEach(row => {
                                            //aggiorno la quantità di prodotto disponibile
                                            try{
                                                const sql = "UPDATE products SET quantity = ? WHERE model = ?";
                                                db.run(sql, [row.diffStock, row.model], (err: Error | null) => {
                                                    if(err) reject(err);
                                                });
                                            }catch(error){
                                                reject(error);
                                            }
                                        });
                                        resolve(true);
                                    }
                                });
                            }catch(error){
                                reject(error);
                            }
                        }
                    }
                });
            }catch(error){
                reject(error);
            }
        });
    }

    getCustomerCarts(user: User): Promise<Cart[]> {
        return new Promise<Cart[]>((resolve, reject) => {
            const sql = "SELECT id, customer, paid, paymentDate, total FROM carts WHERE customer=? AND paid=?";
            db.all(sql, [user.username, 1], (err: Error | null, rows: any[]) => {
                if (err) {
                    return reject(err);
                }
                // Array di promesse per raccogliere i dati dei carrelli
                const cartPromises = rows.map(cart => {
                    return new Promise<Cart>((resolve, reject) => {
                        const sql = "SELECT price, model, category, quantity FROM productsInCart WHERE idCart=?";
                        db.all(sql, [cart.id], (err: Error | null, prods: any[]) => {
                            if (err) {
                                return reject(err);
                            }
                            const productsInCart = prods.map(prod => new ProductInCart(prod.model, prod.quantity, prod.category, prod.price));
                            const completeCart = new Cart(cart.customer, cart.paid, cart.paymentDate, cart.total, productsInCart);
                            resolve(completeCart);
                        });
                    });
                });
                // Attendo che tutte le promesse dei carrelli siano risolte
                Promise.all(cartPromises)
                    .then(carts => resolve(carts))
                    .catch(error => reject(error));
            });
        });
    }

    removeProductFromCart(user:User, product:string):Promise<Boolean>{
        return new Promise<Boolean>((resolve, reject) => {
            try{
                //controllo che il prodotto esista
                const sql = "SELECT sellingPrice, model, category, arrivalDate, details, quantity FROM products WHERE model=?";
                db.get(sql, [product], (err: Error | null, prod: any) => {
                    if(err) reject(err);
                    if(!prod){
                        reject(new ProductNotFoundError());
                    }else{
                        // console.log(prod.model);
                        try{
                            //controllo che il customer abbia un carrello corrente non pagato, non vuoto
                            // console.log("ok")
                            const sql = "SELECT id, customer, paid, paymentDate, total FROM carts WHERE customer=? AND paid=?";
                            db.get(sql, [user.username, 0], (err: Error | null, cart: any) => {
                                // console.log(cart);
                                if(err) reject(err);
                                if(!cart || cart.total==0){
                                    reject(new CartNotFoundError());
                                }else{
                                    // console.log(cart.id);
                                    try{
                                        //controllo che il prodotto da rimuovere sia nel carrello
                                        const sql = "SELECT price, model, quantity FROM productsInCart WHERE idCart=? AND model=?";
                                        db.get(sql, [cart.id, product], (err: Error | null, prod: any) => {
                                            if(err) reject(err);
                                            if(!prod){
                                                reject(new ProductNotInCartError());
                                            }else{
                                                let removePromise:Promise<void>;
                                                if(prod.quantity>1){ //diminuisco la quantità di prodotto nel carrello di una unità
                                                    try{
                                                        const sql = "UPDATE productsInCart SET quantity=? WHERE idCart=? AND model=?";
                                                        removePromise = new Promise<void>((resolve, reject) => {
                                                            db.run(sql, [prod.quantity - 1, cart.id, product], (err: Error) => {
                                                                if (err) return reject(err);
                                                                // console.log('ok');
                                                                resolve();
                                                            });
                                                        });
                                                    }catch(error){
                                                        reject(error);
                                                    }
                                                }else{ //elimino il prodotto dal carrello
                                                    try{
                                                        const sql = "DELETE FROM productsInCart WHERE idCart=? AND model=?";
                                                        removePromise = new Promise<void>((resolve, reject) => {
                                                            db.run(sql, [cart.id, product], (err: Error) => {
                                                                if (err) return reject(err);
                                                                // console.log('ok');
                                                                resolve();
                                                            });
                                                        });
                                                    }catch(error){
                                                        reject(error);
                                                    }
                                                }
                                                //aggiorno il totale del carrello
                                                removePromise.then(() => {
                                                    const sql = "UPDATE carts SET total=? WHERE id=?";
                                                    try{
                                                        db.run(sql, [cart.total - prod.price, cart.id], (err: Error) => {
                                                            if (err) return reject(err);
                                                            resolve(true);
                                                            // console.log(cart.total - prod.price);
                                                        });
                                                    }catch(error){
                                                        reject(error);
                                                    }
                                                }).catch(reject);
                                            }
                                        });
                                    }catch(error){
                                        reject(error);
                                    }
                                }
                            });
                        }catch(error){
                            reject(error);
                        }
                    }
                });
            }catch(error){
                reject(error);
            }
        });
    }

    clearCart(user:User):Promise<Boolean>{
        return new Promise<Boolean>((resolve, reject) => {
            try{
                //controllo che l'utente abbia un carrello corrente
                const sql = "SELECT id, customer, paid, paymentDate, total FROM carts WHERE customer=? AND paid=?";
                db.get(sql, [user.username, 0], (err: Error | null, cart: any) => {
                    if(err) reject(err);
                    if(!cart){
                        reject(new CartNotFoundError());
                    }else{
                        // console.log(cart.id);
                        //let prodInCartUpdate:ProductInCart[];
                        let clearPromise:Promise<void>;
                        try{
                            //rimuovo da productsInCart le entry correlate al carrello da svuotare
                            const sql = "DELETE FROM productsInCart WHERE idCart=?";
                            clearPromise = new Promise<void>((resolve, reject) => {
                                db.run(sql, [cart.id], (err: Error) => {
                                    if(err) return reject(err);
                                    // console.log('productsInCart tolti');
                                    resolve();
                                });
                            });
                            //azzero il totale del carrello svuotato
                            clearPromise.then(() => {
                                const sql = "UPDATE carts SET total=0 WHERE id=?";
                                try{
                                    db.run(sql, [cart.id], (err: Error) => {
                                        if (err) return reject(err);
                                        // console.log('totale carrello azzerato')
                                        resolve(true);
                                    })
                                }catch(error){
                                    reject(error);
                                }
                            }).catch(reject);
                        }catch(error){
                            reject(error);
                        }
                    }
                });
            }catch(error){
                reject(error);
            }
        });
    }

    deleteAllCarts():Promise<Boolean>{
        return new Promise<Boolean>((resolve, reject) => {
            // console.log("ERRORE INTEGRATION !!!!!!!!!!!!!!!!!");
            try{
                const sql="DELETE FROM carts";
                db.run(sql, (err: Error | null) => {
                    if(err) {
                        // console.log(err);
                        reject(err);
                    }
                    resolve(true);
                });
            }catch(error){
                reject(error);
            }
        });
    }

    getAllCarts(): Promise<Cart[]> {
        return new Promise<Cart[]>((resolve, reject) => {
            // console.log('ok');
            try {
                let allCarts: Cart[] = [];
                const sql = "SELECT id, customer, paid, total FROM carts";
                db.all(sql, (err: Error | null, carts: any[]) => {
                    if (err) {
                        return reject(err);
                    }
                    // Array di promesse per attendere tutte le query asincrone
                    let cartPromises = carts.map(cart => {
                        return new Promise<void>((resolve, reject) => {
                            const sql = "SELECT model, category, quantity, price FROM productsInCart WHERE idCart=?";
                            db.all(sql, [cart.id], (err: Error | null, prods: any[]) => {
                                if (err) {
                                    return reject(err);
                                }
                                allCarts.push(new Cart(cart.customer, cart.paid, cart.paid ? cart.paymentDate : null, cart.total, prods.map(prod => new ProductInCart(prod.model, prod.quantity, prod.category, prod.price))));
                                resolve();
                            });
                        });
                    });
                    // Attende il completamento di tutte le promesse
                    Promise.all(cartPromises)
                        .then(() => resolve(allCarts))
                        .catch(error => reject(error));
                });
            } catch (error) {
                reject(error);
            }
        });
    }

}

export default CartDAO