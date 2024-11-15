import { InvalidArrivalDateError, ProductValidationError } from "../errors/productError";
import ProductDAO from "../dao/productDAO";

/**
 * Represents a controller for managing products.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class ProductController {
    private dao: ProductDAO

    constructor() {
        this.dao = new ProductDAO
    }

    /**
     * Registers a new product concept (model, with quantity defining the number of units available) in the database.
     * @param model The unique model of the product.
     * @param category The category of the product.
     * @param quantity The number of units of the new product.
     * @param details The optional details of the product.
     * @param sellingPrice The price at which one unit of the product is sold.
     * @param arrivalDate The optional date in which the product arrived.
     * @returns A Promise that resolves to nothing.
     */
    async registerProducts(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null) /**:Promise<void> */ {
        const arrivalDateNew = arrivalDate ? arrivalDate : new Date().toISOString().split('T')[0];  
        return await this.dao.registerProducts(model, category, quantity, details, sellingPrice, arrivalDateNew)
     }

    /**
     * Increases the available quantity of a product through the addition of new units.
     * @param model The model of the product to increase.
     * @param newQuantity The number of product units to add. This number must be added to the existing quantity, it is not a new total.
     * @param changeDate The optional date in which the change occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */
    async changeProductQuantity(model: string, newQuantity: number, changeDate: string | null) /**:Promise<number> */ {
        const currentDate = new Date().toISOString().split('T')[0];
        const arrivalDate = await this.dao.getProductByModel(model);
        if (changeDate && (changeDate > currentDate || changeDate < arrivalDate[0].arrivalDate)) {
            throw new InvalidArrivalDateError(); // Bad Request
        }
        return this.dao.changeProductQuantity(model, newQuantity,  changeDate)
    }

    /**
     * Decreases the available quantity of a product through the sale of units.
     * @param model The model of the product to sell
     * @param quantity The number of product units that were sold.
     * @param sellingDate The optional date in which the sale occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */
    async sellProduct(model: string, quantity: number, sellingDate: string | null) /**:Promise<number> */ {
        const currentDate = new Date().toISOString().split('T')[0];
        const arrivalDate = await this.dao.getProductByModel(model);
        if (sellingDate && (sellingDate > currentDate || sellingDate < arrivalDate[0].arrivalDate)) {
            throw new InvalidArrivalDateError(); // Bad Request
        }
        return this.dao.sellProduct(model,quantity,sellingDate)
    }

    /**
     * Returns all products in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
    async getProducts(grouping: string | null, category: string | null, model: string | null) /**Promise<Product[]> */ {
        if(grouping== "category" && ! ["Smartphone", "Laptop", "Appliance"].includes(category)){throw new ProductValidationError();}
        if(category && model){    throw new ProductValidationError();}if(category && !grouping){    throw new ProductValidationError();}
        if(!model && grouping=="model"){    throw new ProductValidationError();}
        if(grouping == null)
            return this.dao.getAllProducts();
        else if (grouping == "category")
            return this.dao.getProductByCategory(category);
        else if (grouping == "model")
            return this.dao.getProductByModel(model);
     }

    /**
     * Returns all available products (with a quantity above 0) in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
    async getAvailableProducts(grouping: string | null, category: string | null, model: string | null) /**:Promise<Product[]> */ {
        if(grouping== "category" && ! ["Smartphone", "Laptop", "Appliance"].includes(category)){throw new ProductValidationError();}
        if(category && model){    throw new ProductValidationError();}if(category && !grouping){    throw new ProductValidationError();}
        if(!model && grouping=="model"){    throw new ProductValidationError();}
        if(grouping == null)
            return this.dao.getAvailableProducts(grouping, category, model);
        else if (grouping == "category")
            return this.dao.getAvailableProductByCategory(grouping, category, model);
        else if (grouping == "model"){
            await this.dao.getProductByModel(model);
            return this.dao.getAvailableProductByModel(grouping, category, model);
        }
    }

    /**
     * Deletes all products.
     * @returns A Promise that resolves to `true` if all products have been successfully deleted.
     */
    async deleteAllProducts() /**:Promise <Boolean> */ {
        return this.dao.deleteAllProducts()
     }


    /**
     * Deletes one product, identified by its model
     * @param model The model of the product to delete
     * @returns A Promise that resolves to `true` if the product has been successfully deleted.
     */
    async deleteProduct(model: string) /**:Promise <Boolean> */ {
        const prod = await this.dao.getProductByModel(model);
        return this.dao.deleteProduct(model)
     }

}

export default ProductController;