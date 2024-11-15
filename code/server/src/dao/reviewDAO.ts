/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */

import db from "../db/db";
import { ExistingReviewError, NoReviewProductError } from "../errors/reviewError";
import { ProductReview } from "../components/review";
import { UserNotFoundError } from "../errors/userError";
import { ProductNotFoundError } from "../errors/productError";
import { ProductNotInCartError } from "../errors/cartError";

class ReviewDAO {

    
    //Use case 17.1 - Crea una nuova review
    createReview(model: string, user: string, score: number, date: string, comment: string): Promise<void> {
        return new Promise<void>((resolve, reject) => { 
            try {
                db.serialize(() => {
                    //controllo che lo user esista
                    db.get('SELECT 1 FROM users WHERE username = ?', [user], (err: Error | null, userRow: any) => {
                        if(err){
                            return reject(err)}
                        if(!userRow){
                            return reject(new UserNotFoundError)}
                        // console.log(userRow);
                        //controllo che il prodotto esista
                        db.get('SELECT 1 FROM products WHERE model = ?', [model], (err: Error | null, productRow: any) => {
                            if(err){
                                return reject(err)}
                            if(!productRow){
                                return reject(new ProductNotFoundError)}

                            //controllo che il costumer abbia comprato il prodotto, controllo che farò quando si saprà il db 
                            /*db.get('SELECT 1 FROM carts c JOIN productsInCart pc ON c.id = pc.idCart WHERE c.paid = 1 AND c.customer = ? AND pc.model = ?', [user, model], (err: Error | null, row: any) => {
                                if (err){
                                    return reject(err)}
                                if(!row) {
                                    return reject(new ProductNotInCartError)}*/
                                //se passo i controlli inserisco la review
                                const sql = 'INSERT INTO ProductReview(model, user, score, date, comment) values(?, ?, ?, ?, ?)';
                                db.run(sql, [model, user, score, date, comment], (err: Error | null) => {
                                    if(err) {
                                        if (err.message.includes("UNIQUE constraint failed")) 
                                            reject(new ExistingReviewError);
                                        else
                                            reject(err);
                                    } else {
                                        resolve();
                                    }
                                })
                            //})
                        })
                    })
                })
            } catch (err) {
                reject(err);
            }
        })
    }

    //Use case 17.2 - Elimina una review fatta da uno user per un prodotto
    /*deleteReview(model: string, user: string): Promise<boolean> {
        return new Promise <boolean> ((resolve, reject) => {
            try {
                const sql = 'DELETE FROM ProductReview WHERE model = ? AND user = ?';
                db.run(sql, [model, user], function (err: Error | null) {
                    if(err)
                        return reject(err);
                    else if (this.changes == 0) {
                         return reject(new NoReviewProductError);    
                    } 
                    else {
                        resolve(true); //MOSTRARE UN MESSAGGIO CHE COMFERMI L'ELIMINAZIONE
                    }
                })
            } catch (err) {
                reject(err);
            }
        })
    }*/

    deleteReview(model: string, user: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // Verifica se il prodotto esiste
            const sqlProduct = 'SELECT model FROM products WHERE model = ?';
            db.get(sqlProduct, [model], (err: Error | null, prod: any) => {
                if (err) {
                    return reject(err);
                }
                if (!prod) {
                    return reject(new ProductNotFoundError());
                }
                // Verifica se esiste una recensione per il prodotto da parte dell'utente
                const sqlReview = 'SELECT * FROM ProductReview WHERE model = ? AND user = ?';
                db.get(sqlReview, [model, user], (err: Error | null, rev: any) => {
                    if (err) {
                        return reject(err);
                    }
                    if (!rev) {
                        return reject(new NoReviewProductError());
                    }
                    // Cancella la recensione
                    const sqlDelete = 'DELETE FROM ProductReview WHERE model = ? AND user = ?';
                    db.run(sqlDelete, [model, user], (err: Error | null) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve();
                    });
                });
            });
        });
    }
        
    //Use case 18 - visualizza tutte le reviews di un prodotto
    viewReview(model: string): Promise<ProductReview[]> {
        return new Promise <ProductReview[]> ((resolve, reject) => {
            try {
                db.serialize(() => {
                    //controllo che il prodotto esista
                    db.get('SELECT 1 FROM products WHERE model = ?', [model], (err: Error | null, productRow: any) => {
                        if(err)
                            return reject(err);
                        if(!productRow)
                            return reject(new ProductNotFoundError);
                            //recupero tutte le recensioni per un prodotto
                        db.all('SELECT * FROM ProductReview WHERE model = ?', [model], (err: Error | null, reviews: any[]) => {
                            if(err){
                                return reject(err);
                            } else if(!reviews || reviews.length === 0) {
                                // console.log("b");
                                return resolve([]);
                            } else {
                                // console.log("c");
                                const reviewsProduct =  reviews.map(review => new ProductReview(review.model, review.user, review.score, review.date, review.comment));
                                resolve(reviewsProduct);
                            }
                        })
                    })
                })
            } catch (err) {
                reject(err);
            }
        })
    }

    //Use case 19.1 - Elimina tutte le reviews di uno specifico modello di prodotto
    /*deleteReviewsOfProduct(model: string): Promise<boolean> {
        return new Promise <boolean> ((resolve, reject) => {
            try{
                db.serialize(() => {
                    //controllo che il prodotto esista
                    db.get('SELECT 1 FROM products WHERE model = ?', [model], (err: Error | null, productRow: any) => {
                        if(err)
                            return reject(err);
                        if(!productRow)
                            return reject(new ProductNotFoundError);
                        db.run('DELETE FROM ProductReview WHERE model = ?', [model], function (err: Error | null) {
                            if(err) 
                                return reject(err);
                            else if(this.changes == 0)
                                return reject(new NoReviewProductError);
                            else 
                                resolve(true);
                        })
                    })
                })
            } catch (err) {
                reject(err);
            }
        })
    }*/

    deleteReviewsOfProduct(model: string): Promise<void> {
        return new Promise <void> ((resolve, reject) => {
            try{
                db.serialize(() => {
                    //controllo che il prodotto esista
                    db.get('SELECT 1 FROM products WHERE model = ?', [model], (err: Error | null, productRow: any) => {
                        if(err)
                            return reject(err);
                        if(!productRow)
                            return reject(new ProductNotFoundError());
                        db.run('DELETE FROM ProductReview WHERE model = ?', [model], function (err: Error | null) {
                            if(err) return reject(err);
                            resolve();
                        })
                    })
                })
            } catch (err) {
                reject(err);
            }
        })
    }

    //Use case 19.2 - Elimina tutte le reviews
    /*deleteAllReviews(): Promise <boolean> {
        return new Promise <boolean> ((resolve, reject) => {
            try {
                db.serialize(() => {
                    db.run('DELETE FROM ProductReview', [], function (err: Error | null) {
                        if(err)
                            return reject(err);
                        else if(this.changes == 0) 
                            return reject(new NoReviewProductError);
                        else 
                            resolve(true);
                    })
                })
            } catch(err) {
                reject(err);
            }
        })
    }*/ 

    deleteAllReviews(): Promise <void> {
        return new Promise <void> ((resolve, reject) => {
            try {
                db.serialize(() => {
                    db.run('DELETE FROM ProductReview', [], function (err: Error | null) {
                        if(err) return reject(err);
                        else resolve();
                    })
                })
            } catch(err) {
                reject(err);
            }
        })
    }

}


export default ReviewDAO;