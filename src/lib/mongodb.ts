import { MongoClient, Db, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sk_tutorials";
const DB_NAME = process.env.MONGODB_DB || "sk_tutorials";

let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

// In-Memory Database Fallback Store for Local Testing without running MongoDB daemon
class InMemoryCollection {
  private name: string;
  private static store: Record<string, any[]> = {};

  constructor(name: string) {
    this.name = name;
    if (!InMemoryCollection.store[name]) {
      InMemoryCollection.store[name] = [];
    }
  }

  private get items(): any[] {
    return InMemoryCollection.store[this.name];
  }

  async createIndex() {
    return true;
  }

  async findOne(query: Record<string, any> = {}) {
    return (
      this.items.find((item) =>
        Object.entries(query).every(([k, v]) => {
          if (k === "$or" && Array.isArray(v)) {
            return v.some((cond) =>
              Object.entries(cond).every(([ck, cv]) =>
                cv instanceof RegExp ? cv.test(item[ck] || "") : item[ck] === cv
              )
            );
          }
          if (v instanceof ObjectId) return item._id?.toString() === v.toString();
          return item[k] === v;
        })
      ) || null
    );
  }

  find(query: Record<string, any> = {}) {
    let result = this.items.filter((item) =>
      Object.entries(query).every(([k, v]) => {
        if (k === "status" && v !== "All") return item.status === v;
        if (k === "class" && v !== "All") return item.class === v;
        if (k === "batch" && v !== "All") return item.batch === v;
        if (k === "mode" && v !== "All") return item.mode === v;
        if (k === "month" && typeof v === "number") return item.month === v;
        if (k === "year" && typeof v === "number") return item.year === v;
        if (k === "studentId" && typeof v === "object" && v.$in) return v.$in.includes(item.studentId);
        if (k === "$or" && Array.isArray(v)) {
          return v.some((cond) =>
            Object.entries(cond).every(([ck, cv]) =>
              cv instanceof RegExp ? cv.test(item[ck] || "") : item[ck] === cv
            )
          );
        }
        if (v instanceof ObjectId) return item._id?.toString() === v.toString();
        return item[k] === v;
      })
    );

    return {
      sort: (sortObj: Record<string, number>) => {
        const field = Object.keys(sortObj)[0];
        const dir = sortObj[field];
        if (field) {
          result.sort((a, b) => {
            if (a[field] < b[field]) return dir === 1 ? -1 : 1;
            if (a[field] > b[field]) return dir === 1 ? 1 : -1;
            return 0;
          });
        }
        return {
          limit: (n: number) => ({
            toArray: async () => result.slice(0, n),
          }),
          toArray: async () => result,
        };
      },
      limit: (n: number) => ({
        toArray: async () => result.slice(0, n),
      }),
      toArray: async () => result,
    };
  }

  async insertOne(doc: any) {
    const _id = new ObjectId();
    const newDoc = { _id, ...doc };
    this.items.push(newDoc);
    return { insertedId: _id };
  }

  async updateOne(filter: Record<string, any>, update: Record<string, any>) {
    const item = await this.findOne(filter);
    if (!item) return { matchedCount: 0, modifiedCount: 0 };
    if (update.$set) {
      Object.assign(item, update.$set);
    }
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async updateMany(filter: Record<string, any>, update: Record<string, any>) {
    const items = await this.find(filter).toArray();
    items.forEach((item) => {
      if (update.$set) Object.assign(item, update.$set);
    });
    return { matchedCount: items.length, modifiedCount: items.length };
  }

  async deleteOne(filter: Record<string, any>) {
    const index = this.items.findIndex((item) =>
      Object.entries(filter).every(([k, v]) =>
        v instanceof ObjectId ? item._id?.toString() === v.toString() : item[k] === v
      )
    );
    if (index === -1) return { deletedCount: 0 };
    this.items.splice(index, 1);
    return { deletedCount: 1 };
  }

  async deleteMany(filter: Record<string, any>) {
    const initialLen = this.items.length;
    InMemoryCollection.store[this.name] = this.items.filter(
      (item) =>
        !Object.entries(filter).every(([k, v]) => {
          if (typeof v === "object" && v.$in) return v.$in.includes(item[k]);
          if (v instanceof ObjectId) return item._id?.toString() === v.toString();
          return item[k] === v;
        })
    );
    return { deletedCount: initialLen - this.items.length };
  }

  async countDocuments(query: Record<string, any> = {}) {
    const items = await this.find(query).toArray();
    return items.length;
  }
}

class InMemoryDb {
  collection(name: string) {
    return new InMemoryCollection(name);
  }
}

export async function connectToDatabase(): Promise<{ client: any; db: any }> {
  if (cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 2000, // 2s quick check
    });

    await client.connect();
    const db = client.db(DB_NAME);

    cachedClient = client;
    cachedDb = db;

    // Create essential indexes asynchronously
    try {
      await db.collection("students").createIndex({ studentId: 1 }, { unique: true });
      await db.collection("students").createIndex({ parentMobile: 1 });
      await db.collection("students").createIndex({ status: 1 });

      await db.collection("payments").createIndex({ studentId: 1, month: 1, year: 1 }, { unique: true });
      await db.collection("payments").createIndex({ paymentDate: -1 });

      await db.collection("expenses").createIndex({ date: -1 });
      await db.collection("admins").createIndex({ email: 1 }, { unique: true });
    } catch (err) {
      console.warn("MongoDB index creation warning:", err);
    }

    console.log("Connected to MongoDB Native database.");
    return { client, db };
  } catch (err) {
    console.warn(
      "Local MongoDB connection not found. Falling back to In-Memory Database mode for local testing."
    );
    cachedDb = new InMemoryDb();
    return { client: null, db: cachedDb };
  }
}

export async function getDb(): Promise<any> {
  const { db } = await connectToDatabase();
  return db;
}
