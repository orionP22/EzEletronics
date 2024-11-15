import ReviewDAO from '../../src/dao/reviewDAO';
import db from "../../src/db/db";
import { Database } from "sqlite3";
import {UserNotFoundError} from "../../src/errors/userError";
import { ProductNotFoundError } from '../../src/errors/productError';
import {ProductNotInCartError} from '../../src/errors/cartError';
import {ExistingReviewError, NoReviewProductError} from '../../src/errors/reviewError';
import { ProductReview } from '../../src/components/review';

describe("ReviewDAO", () =>{
    let revDAO: ReviewDAO;

    beforeEach(() => {
        revDAO = new ReviewDAO();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });
    
    test("createReview - aggiunta review funzionante", async () => {
        // Mock delle chiamate db.get
        const mockDBGet = jest.spyOn(db, "get")
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, { username: "testUser" }); // Simula utente trovato
                return {} as Database;
            })
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, { model: "testModel" }); // Simula prodotto trovato
                return {} as Database;
            })
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, {}); // Simula prodotto presente nel carrello
                return {} as Database;
            });
    
        // Mock della chiamata db.run
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null); // Simula successo nell'inserimento della review
            return {} as Database; // Restituisce un oggetto vuoto come Database
        });
    
        await expect(revDAO.createReview("testModel", "testUser", 3, "2024-06-02", "testComment")).resolves.toBeUndefined();
    
        expect(mockDBGet).toHaveBeenNthCalledWith(
            1, 
            'SELECT 1 FROM users WHERE username = ?', 
            ["testUser"], 
            expect.any(Function)
        );
    
        expect(mockDBGet).toHaveBeenNthCalledWith(
            2, 
            'SELECT 1 FROM products WHERE model = ?', 
            ["testModel"], 
            expect.any(Function)
        );
    
        /*expect(mockDBGet).toHaveBeenNthCalledWith(
            3, 
            'SELECT 1 FROM carts c JOIN productsInCart pc ON c.id = pc.idCart WHERE c.paid = 1 AND c.customer = ? AND pc.model = ?', 
            ["testUser", "testModel"], 
            expect.any(Function)
        );*/
    
        expect(mockDBRun).toHaveBeenCalledWith(
            'INSERT INTO ProductReview(model, user, score, date, comment) values(?, ?, ?, ?, ?)', 
            ["testModel", "testUser", 3, "2024-06-02", "testComment"], 
            expect.any(Function)
        );
    
        // Ripristina i mock originali
        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });
    
    test("createReview - restituisce UserNotFoundError se l'utente non esiste", async () => {
        // Mock della prima chiamata db.get per simulare utente non trovato
        const mockDBGet = jest.spyOn(db, "get")
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, null); // Simula utente non trovato
                return {} as Database;
            });
    
        // Mock delle chiamate successive non necessario perché il flusso si ferma dopo il primo controllo
    
        await expect(revDAO.createReview("testModel", "testUser", 3, "2024-06-02", "testComment"))
            .rejects.toThrow(UserNotFoundError);
    
        expect(mockDBGet).toHaveBeenCalledWith(
            'SELECT 1 FROM users WHERE username = ?', 
            ["testUser"], 
            expect.any(Function)
        );
    
        // Ripristina il mock originale
        mockDBGet.mockRestore();
    });
    
    test("createReview - restituisce ProductNotFoundError se il prodotto non esiste", async () => {
        // Mock della prima chiamata db.get per simulare utente trovato
        const mockDBGet = jest.spyOn(db, "get")
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, { username: "testUser" }); // Simula utente trovato
                return {} as Database;
            })
            // Mock della seconda chiamata db.get per simulare prodotto non trovato
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, null); // Simula prodotto non trovato
                return {} as Database;
            });
    
        await expect(revDAO.createReview("testModel", "testUser", 3, "2024-06-02", "testComment"))
            .rejects.toThrow(ProductNotFoundError);
    
        expect(mockDBGet).toHaveBeenNthCalledWith(
            1, 
            'SELECT 1 FROM users WHERE username = ?', 
            ["testUser"], 
            expect.any(Function)
        );
    
        expect(mockDBGet).toHaveBeenNthCalledWith(
            2, 
            'SELECT 1 FROM products WHERE model = ?', 
            ["testModel"], 
            expect.any(Function)
        );
    
        // Ripristina il mock originale
        mockDBGet.mockRestore();
    });
    /*
    test("createReview - restituisce ProductNotInCartError se il prodotto non è nel carrello", async () => {
        // Mock delle chiamate db.get per simulare utente e prodotto trovati
        const mockDBGet = jest.spyOn(db, "get")
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, { username: "testUser" }); // Simula utente trovato
                return {} as Database;
            })
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, { model: "testModel" }); // Simula prodotto trovato
                return {} as Database;
            })
            // Mock della terza chiamata db.get per simulare prodotto non presente nel carrello
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, null); // Simula prodotto non presente nel carrello
                return {} as Database;
            });
    
        await expect(revDAO.createReview("testModel", "testUser", 3, "2024-06-02", "testComment"))
            .rejects.toThrow(ProductNotInCartError);
    
        expect(mockDBGet).toHaveBeenNthCalledWith(
            1, 
            'SELECT 1 FROM users WHERE username = ?', 
            ["testUser"], 
            expect.any(Function)
        );
    
        expect(mockDBGet).toHaveBeenNthCalledWith(
            2, 
            'SELECT 1 FROM products WHERE model = ?', 
            ["testModel"], 
            expect.any(Function)
        );
    
        expect(mockDBGet).toHaveBeenNthCalledWith(
            3, 
            'SELECT 1 FROM carts c JOIN productsInCart pc ON c.id = pc.idCart WHERE c.paid = 1 AND c.customer = ? AND pc.model = ?', 
            ["testUser", "testModel"], 
            expect.any(Function)
        );
    
        // Ripristina il mock originale
        mockDBGet.mockRestore();
    });*/
    
    test("createReview - restituisce ExistingReviewError se la recensione esiste già", async () => {
        // Mock delle chiamate db.get per simulare utente e prodotto trovati
        const mockDBGet = jest.spyOn(db, "get")
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, { username: "testUser" }); // Simula utente trovato
                return {} as Database;
            })
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, { model: "testModel" }); // Simula prodotto trovato
                return {} as Database;
            })
            // Mock della terza chiamata db.get per simulare prodotto presente nel carrello
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, {}); // Simula prodotto presente nel carrello
                return {} as Database;
            });
    
        // Mock della chiamata db.run per simulare l'inserimento della recensione già esistente
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("UNIQUE constraint failed")); // Simula errore di recensione esistente
            return {} as Database;
        });
    
        await expect(revDAO.createReview("testModel", "testUser", 3, "2024-06-02", "testComment"))
            .rejects.toThrow(ExistingReviewError);
    
        expect(mockDBGet).toHaveBeenNthCalledWith(
            1, 
            'SELECT 1 FROM users WHERE username = ?', 
            ["testUser"], 
            expect.any(Function)
        );
    
        expect(mockDBGet).toHaveBeenNthCalledWith(
            2, 
            'SELECT 1 FROM products WHERE model = ?', 
            ["testModel"], 
            expect.any(Function)
        );
        /*
        expect(mockDBGet).toHaveBeenNthCalledWith(
            3, 
            'SELECT 1 FROM carts c JOIN productsInCart pc ON c.id = pc.idCart WHERE c.paid = 1 AND c.customer = ? AND pc.model = ?', 
            ["testUser", "testModel"], 
            expect.any(Function)
        );*/
    
        expect(mockDBRun).toHaveBeenCalledWith(
            'INSERT INTO ProductReview(model, user, score, date, comment) values(?, ?, ?, ?, ?)', 
            ["testModel", "testUser", 3, "2024-06-02", "testComment"], 
            expect.any(Function)
        );
    
        // Ripristina i mock originali
        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });
    
    test("createReview - gestisce correttamente gli errori del database", async () => {
        // Mock delle chiamate db.get per simulare utente e prodotto trovati
        jest.spyOn(db, "get")
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, { username: "testUser" }); // Simula utente trovato
                return {} as Database;
            })
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, { model: "testModel" }); // Simula prodotto trovato
                return {} as Database;
            })
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, {}); // Simula prodotto presente nel carrello
                return {} as Database;
            });
    
        // Mock della chiamata db.run per simulare un errore del database
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Errore del database")); // Simula un errore del database
            return {} as Database;
        });
    
        await expect(revDAO.createReview("testModel", "testUser", 3, "2024-06-02", "testComment"))
            .rejects.toThrow(Error);
    
        expect(mockDBRun).toHaveBeenCalledWith(
            'INSERT INTO ProductReview(model, user, score, date, comment) values(?, ?, ?, ?, ?)', 
            ["testModel", "testUser", 3, "2024-06-02", "testComment"], 
            expect.any(Function)
        );
    
        // Ripristina i mock originali
        mockDBRun.mockRestore();
    });

    test('deleteReview - cancella una review esistente', async () => {
        // Mock delle chiamate db.get
        const mockDBGet = jest.spyOn(db, 'get')
            .mockImplementationOnce((sql, params, callback) => {
                // Simula che il prodotto esiste
                callback(null, { model: 'testModel' });
                return {} as Database;
            })
            .mockImplementationOnce((sql, params, callback) => {
                // Simula che la recensione esiste
                callback(null, { model: 'testModel', user: 'testUser' });
                return {} as Database;
            });

        // Mock della chiamata db.run per simulare la cancellazione della recensione
        const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            // Simula la cancellazione della recensione senza errori
            callback(null);
            return {} as Database;
        });

        await expect(revDAO.deleteReview('testModel', 'testUser')).resolves.toBeUndefined();

        expect(mockDBGet).toHaveBeenNthCalledWith(
            1,
            'SELECT model FROM products WHERE model = ?',
            ['testModel'],
            expect.any(Function)
        );

        expect(mockDBGet).toHaveBeenNthCalledWith(
            2,
            'SELECT * FROM ProductReview WHERE model = ? AND user = ?',
            ['testModel', 'testUser'],
            expect.any(Function)
        );

        expect(mockDBRun).toHaveBeenCalledWith(
            'DELETE FROM ProductReview WHERE model = ? AND user = ?',
            ['testModel', 'testUser'],
            expect.any(Function)
        );

        // Ripristina i mock originali
        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });

    test('deleteReview - gestisce correttamente gli errori del database durante la verifica del prodotto', async () => {
        // Mock della chiamata db.get per simulare un errore del database
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            // Simula un errore del database durante la verifica del prodotto
            callback(new Error('Errore del database'), null);
            return {} as Database;
        });

        await expect(revDAO.deleteReview('testModel', 'testUser')).rejects.toThrow(Error);

        // Verifica che db.get sia stata chiamata con i parametri corretti
        expect(mockDBGet).toHaveBeenCalledWith(
            'SELECT model FROM products WHERE model = ?',
            ['testModel'],
            expect.any(Function)
        );

        // Ripristina i mock originali
        mockDBGet.mockRestore();
    });

    test('deleteReview - gestisce correttamente gli errori del database durante la verifica della recensione', async () => {
        // Mock della chiamata db.get per simulare la verifica del prodotto e poi un errore del database per la recensione
        const mockDBGet = jest.spyOn(db, 'get')
            .mockImplementationOnce((sql, params, callback) => {
                // Simula che il prodotto esiste
                callback(null, { model: 'testModel' });
                return {} as Database;
            })
            .mockImplementationOnce((sql, params, callback) => {
                // Simula un errore del database durante la verifica della recensione
                callback(new Error('Errore del database'), null);
                return {} as Database;
            });

        await expect(revDAO.deleteReview('testModel', 'testUser')).rejects.toThrow(Error);

        expect(mockDBGet).toHaveBeenNthCalledWith(
            1,
            'SELECT model FROM products WHERE model = ?',
            ['testModel'],
            expect.any(Function)
        );

        expect(mockDBGet).toHaveBeenNthCalledWith(
            2,
            'SELECT * FROM ProductReview WHERE model = ? AND user = ?',
            ['testModel', 'testUser'],
            expect.any(Function)
        );

        // Ripristina i mock originali
        mockDBGet.mockRestore();
    });

    test('deleteReview - gestisce correttamente il caso in cui il prodotto non esiste', async () => {
        // Mock della chiamata db.get per simulare che il prodotto non esiste
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            // Simula che il prodotto non esiste
            callback(null, null);
            return {} as Database;
        });

        await expect(revDAO.deleteReview('testModel', 'testUser')).rejects.toThrow(ProductNotFoundError);

        expect(mockDBGet).toHaveBeenCalledWith(
            'SELECT model FROM products WHERE model = ?',
            ['testModel'],
            expect.any(Function)
        );

        // Ripristina i mock originali
        mockDBGet.mockRestore();
    });

    test('deleteReview - gestisce il caso in cui la recensione non esiste', async () => {
        // Mock delle chiamate db.get per simulare la verifica del prodotto e che la recensione non esiste
        const mockDBGet = jest.spyOn(db, 'get')
            .mockImplementationOnce((sql, params, callback) => {
                // Simula che il prodotto esiste
                callback(null, { model: 'testModel' });
                return {} as Database;
            })
            .mockImplementationOnce((sql, params, callback) => {
                // Simula che la recensione non esiste
                callback(null, null);
                return {} as Database;
            });

        await expect(revDAO.deleteReview('testModel', 'testUser')).rejects.toThrow(NoReviewProductError);

        expect(mockDBGet).toHaveBeenNthCalledWith(
            1,
            'SELECT model FROM products WHERE model = ?',
            ['testModel'],
            expect.any(Function)
        );

        expect(mockDBGet).toHaveBeenNthCalledWith(
            2,
            'SELECT * FROM ProductReview WHERE model = ? AND user = ?',
            ['testModel', 'testUser'],
            expect.any(Function)
        );

        // Ripristina i mock originali
        mockDBGet.mockRestore();
    });
    
    test("viewReview - visualizza recensioni esistenti per un prodotto", async () => {
        // Mock della chiamata db.get per simulare il recupero del prodotto esistente
        const mockDBGetProduct = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            // Simula il recupero di un prodotto esistente
            callback(null, { model: "testModel" });
            return {} as Database;
        });
    
        // Mock della chiamata db.all per simulare il recupero delle recensioni del prodotto
        const mockDBAllReviews = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            // Simula il recupero delle recensioni del prodotto
            callback(null, [
                { model: "testModel", user: "user1", score: 4, date: "2024-06-01", comment: "Great product" },
                { model: "testModel", user: "user2", score: 5, date: "2024-06-02", comment: "Excellent quality" }
            ]);
            return {} as Database;
        });
    
        const result = await revDAO.viewReview("testModel");
    
        // Verifica che le recensioni vengano restituite correttamente
        expect(result).toEqual([
            new ProductReview("testModel", "user1", 4, "2024-06-01", "Great product"),
            new ProductReview("testModel", "user2", 5, "2024-06-02", "Excellent quality")
        ]);
    
        // Verifica che db.get sia stata chiamata con i parametri corretti
        expect(mockDBGetProduct).toHaveBeenCalledWith(
            'SELECT 1 FROM products WHERE model = ?',
            ["testModel"],
            expect.any(Function)
        );
    
        // Verifica che db.all sia stata chiamata con i parametri corretti
        expect(mockDBAllReviews).toHaveBeenCalledWith(
            'SELECT * FROM ProductReview WHERE model = ?',
            ["testModel"],
            expect.any(Function)
        );
    
        // Ripristina i mock originali
        mockDBGetProduct.mockRestore();
        mockDBAllReviews.mockRestore();
    });
    
    test("viewReview - visualizza recensioni per un prodotto non esistente", async () => {
        // Mock della chiamata db.get per simulare il recupero di un prodotto non esistente
        const mockDBGetProduct = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            // Simula il recupero di un prodotto non esistente
            callback(null, null);
            return {} as Database;
        });
    
        await expect(revDAO.viewReview("nonExistingModel")).rejects.toThrow(ProductNotFoundError); // Assicura che il metodo rigetti con un'eccezione ProductNotFoundError
    
        // Verifica che db.get sia stata chiamata con i parametri corretti
        expect(mockDBGetProduct).toHaveBeenCalledWith(
            'SELECT 1 FROM products WHERE model = ?',
            ["nonExistingModel"],
            expect.any(Function)
        );
    
        // Ripristina il mock originale
        mockDBGetProduct.mockRestore();
    });
    
    test("viewReview - gestisce correttamente gli errori del database", async () => {
        // Mock della chiamata db.get per simulare un errore del database
        const mockDBGetProduct = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            // Simula un errore del database
            callback(new Error("Errore del database"));
            return {} as Database;
        });
    
        await expect(revDAO.viewReview("testModel")).rejects.toThrow(Error); // Assicura che il metodo rigetti con un errore generico
    
        // Verifica che db.get sia stata chiamata con i parametri corretti
        expect(mockDBGetProduct).toHaveBeenCalledWith(
            'SELECT 1 FROM products WHERE model = ?',
            ["testModel"],
            expect.any(Function)
        );
    
        // Ripristina il mock originale
        mockDBGetProduct.mockRestore();
    });

    test('deleteReviewsOfProduct - cancella le recensioni di un prodotto esistente', async () => {
        // Mock della chiamata db.get per simulare che il prodotto esiste
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            // Simula che il prodotto esiste
            callback(null, { model: 'testModel' });
            return {} as Database;
        });

        // Mock della chiamata db.run per simulare la cancellazione delle recensioni del prodotto
        const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            // Simula la cancellazione delle recensioni senza errori
            callback(null);
            return {} as Database;
        });

        await expect(revDAO.deleteReviewsOfProduct('testModel')).resolves.toBeUndefined();

        // Verifica che db.get sia stata chiamata con i parametri corretti per la verifica del prodotto
        expect(mockDBGet).toHaveBeenCalledWith(
            'SELECT 1 FROM products WHERE model = ?',
            ['testModel'],
            expect.any(Function)
        );

        // Verifica che db.run sia stata chiamata con i parametri corretti per la cancellazione delle recensioni
        expect(mockDBRun).toHaveBeenCalledWith(
            'DELETE FROM ProductReview WHERE model = ?',
            ['testModel'],
            expect.any(Function)
        );

        // Ripristina i mock originali
        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });

    test('deleteReviewsOfProduct - gestisce correttamente l errore del database', async () => {
        // Mock della chiamata db.get per simulare un errore del database
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            // Simula un errore del database durante la verifica del prodotto
            callback(new Error('Errore del database'), null);
            return {} as Database;
        });

        // Verifica che la cancellazione delle recensioni gestisca correttamente l'errore del database
        await expect(revDAO.deleteReviewsOfProduct('testModel')).rejects.toThrow(Error);

        // Verifica che db.get sia stata chiamata con i parametri corretti per la verifica del prodotto
        expect(mockDBGet).toHaveBeenCalledWith(
            'SELECT 1 FROM products WHERE model = ?',
            ['testModel'],
            expect.any(Function)
        );

        // Ripristina il mock originale
        mockDBGet.mockRestore();
    });

    test('deleteReviewsOfProduct - gestisce correttamente il prodotto non trovato', async () => {
        // Mock della chiamata db.get per simulare che il prodotto non esiste
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            // Simula che il prodotto non esiste
            callback(null, null);
            return {} as Database;
        });

        // Verifica che la cancellazione delle recensioni gestisca correttamente il caso in cui il prodotto non esiste
        await expect(revDAO.deleteReviewsOfProduct('testModel')).rejects.toThrow(ProductNotFoundError);

        // Verifica che db.get sia stata chiamata con i parametri corretti per la verifica del prodotto
        expect(mockDBGet).toHaveBeenCalledWith(
            'SELECT 1 FROM products WHERE model = ?',
            ['testModel'],
            expect.any(Function)
        );

        // Ripristina il mock originale
        mockDBGet.mockRestore();
    });

    test('deleteAllReviews - cancella tutte le recensioni', async () => {
        // Mock della chiamata db.run per simulare la cancellazione di tutte le recensioni
        const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            // Simula la cancellazione di tutte le recensioni senza errori
            callback(null);
            return {} as Database;
        });

        await expect(revDAO.deleteAllReviews()).resolves.toBeUndefined();

        // Verifica che db.run sia stata chiamata con i parametri corretti per la cancellazione di tutte le recensioni
        expect(mockDBRun).toHaveBeenCalledWith(
            'DELETE FROM ProductReview',
            [],
            expect.any(Function)
        );

        // Ripristina il mock originale
        mockDBRun.mockRestore();
    });

    test('deleteAllReviews - gestisce correttamente l errore del database', async () => {
        // Mock della chiamata db.run per simulare un errore del database
        const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            // Simula un errore del database durante la cancellazione di tutte le recensioni
            callback(new Error('Errore del database'));
            return {} as Database;
        });

        // Verifica che la cancellazione di tutte le recensioni gestisca correttamente l'errore del database
        await expect(revDAO.deleteAllReviews()).rejects.toThrow(Error);

        // Verifica che db.run sia stata chiamata con i parametri corretti per la cancellazione di tutte le recensioni
        expect(mockDBRun).toHaveBeenCalledWith(
            'DELETE FROM ProductReview',
            [],
            expect.any(Function)
        );

        // Ripristina il mock originale
        mockDBRun.mockRestore();
    });
    
})