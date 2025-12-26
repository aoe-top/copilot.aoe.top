import { MongoClient } from "mongodb";
import type {
    MongoClientOptions,
    Db,
    Collection,
    Document,
    Filter,
    UpdateFilter,
    InsertOneResult,
    InsertManyResult,
    UpdateResult,
    DeleteResult,
    FindCursor,
    WithId,
} from "mongodb";
import { attachDatabasePool } from "@vercel/functions";

export class UtilsMongodb {
    private client: MongoClient;
    private db: Db;

    constructor() {
        const options: MongoClientOptions = {
            appName: "devrel.vercel.integration",
            maxIdleTimeMS: 5000,
        };
        this.client = new MongoClient(process.env.MONGODB_URI!, options);

        // Attach the client to ensure proper cleanup on function suspension
        attachDatabasePool(this.client);

        // Get the database (avoid defaulting to "test")
        const dbName = process.env.MONGODB_DB || "Glosc";
        this.db = this.client.db(dbName);
    }

    /**
     * 插入单个文档
     * @param collectionName 集合名称
     * @param doc 要插入的文档
     * @returns 插入结果
     */
    async insertOne(
        collectionName: string,
        doc: Document
    ): Promise<InsertOneResult<Document>> {
        const collection = this.db.collection(collectionName);
        return await collection.insertOne(doc);
    }

    /**
     * 插入多个文档
     * @param collectionName 集合名称
     * @param docs 要插入的文档数组
     * @returns 插入结果
     */
    async insertMany(
        collectionName: string,
        docs: Document[]
    ): Promise<InsertManyResult<Document>> {
        const collection = this.db.collection(collectionName);
        return await collection.insertMany(docs);
    }

    /**
     * 查询单个文档
     * @param collectionName 集合名称
     * @param query 查询条件
     * @returns 找到的文档或 null
     */
    async findOne(
        collectionName: string,
        query: Filter<Document>
    ): Promise<WithId<Document> | null> {
        const collection = this.db.collection(collectionName);
        return await collection.findOne(query);
    }

    /**
     * 查询多个文档
     * @param collectionName 集合名称
     * @param query 查询条件
     * @param options 查询选项，如 limit, sort 等
     * @returns 文档数组
     */
    async find(
        collectionName: string,
        query: Filter<Document> = {},
        options: any = {}
    ): Promise<WithId<Document>[]> {
        const collection = this.db.collection(collectionName);
        const cursor = collection.find(query, options);
        return await cursor.toArray();
    }

    /**
     * 更新单个文档
     * @param collectionName 集合名称
     * @param query 查询条件
     * @param update 更新操作
     * @returns 更新结果
     */
    async updateOne(
        collectionName: string,
        query: Filter<Document>,
        update: UpdateFilter<Document>
    ): Promise<UpdateResult> {
        const collection = this.db.collection(collectionName);
        return await collection.updateOne(query, update);
    }

    /**
     * 更新多个文档
     * @param collectionName 集合名称
     * @param query 查询条件
     * @param update 更新操作
     * @returns 更新结果
     */
    async updateMany(
        collectionName: string,
        query: Filter<Document>,
        update: UpdateFilter<Document>
    ): Promise<UpdateResult> {
        const collection = this.db.collection(collectionName);
        return await collection.updateMany(query, update);
    }

    /**
     * 删除单个文档
     * @param collectionName 集合名称
     * @param query 查询条件
     * @returns 删除结果
     */
    async deleteOne(
        collectionName: string,
        query: Filter<Document>
    ): Promise<DeleteResult> {
        const collection = this.db.collection(collectionName);
        return await collection.deleteOne(query);
    }

    /**
     * 删除多个文档
     * @param collectionName 集合名称
     * @param query 查询条件
     * @returns 删除结果
     */
    async deleteMany(
        collectionName: string,
        query: Filter<Document>
    ): Promise<DeleteResult> {
        const collection = this.db.collection(collectionName);
        return await collection.deleteMany(query);
    }

    /**
     * 获取集合
     * @param collectionName 集合名称
     * @returns 集合对象
     */
    getCollection(collectionName: string): Collection<Document> {
        return this.db.collection(collectionName);
    }

    /**
     * 关闭连接（在 Vercel Functions 中通常不需要手动关闭）
     */
    async close(): Promise<void> {
        await this.client.close();
    }
}
