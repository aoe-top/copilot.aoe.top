import { modelsList } from "../utils/ModelList";

//http://localhost:3000/api/models
export default defineEventHandler(async (event) => {
    const list = modelsList;
    return { object: "list", data: list };
});
