import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getSessionServer } from "@/utils/auth";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSessionServer(req, res);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { method } = req;
  const userId = session.id; // Use session.id to get the user ID

  switch (method) {
    case "POST":
      try {
        const { name } = req.body;
        const category = await prisma.category.create({
          data: {
            name,
            userId,
          },
        });
        res.status(201).json(category);
      } catch (error) {
        console.error("Error al crear la categoría:", error);
        res.status(500).json({ error: "Error al crear la categoría" });
      }
      break;
    case "GET":
      try {
        const categories = await prisma.category.findMany({
          where: { userId },
        });
        res.status(200).json(categories);
      } catch (error) {
        console.error("Error al obtener las categorías:", error);
        res.status(500).json({ error: "Error al obtener las categorías" });
      }
      break;
    case "PUT":
      try {
        const { id, name } = req.body;

        if (!id || !name) {
          return res.status(400).json({ error: "ID y nombre son obligatorios" });
        }

        const updatedCategory = await prisma.category.update({
          where: { id },
          data: { name },
        });

        res.status(200).json(updatedCategory);
      } catch (error) {
        console.error("Error al actualizar la categoría:", error);
        res.status(500).json({ error: "Error al actualizar la categoría" });
      }
      break;
    case "DELETE":
      try {
        const { id } = req.body;
        console.log("Eliminando categoría con ID:", id); // Debug statement

        // Check if the category exists
        const category = await prisma.category.findUnique({
          where: { id },
        });

        if (!category) {
          return res.status(404).json({ error: "Categoría no encontrada" });
        }

        const deleteResponse = await prisma.category.delete({
          where: { id },
        });

        console.log("Respuesta de eliminación:", deleteResponse); // Debug statement

        res.status(204).end();
      } catch (error) {
        console.error("Error al eliminar la categoría:", error);
        res.status(500).json({ error: "Error al eliminar la categoría" });
      }
      break;
    default:
      res.setHeader("Allow", ["POST", "GET", "PUT", "DELETE"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export const config = {
  api: {
    externalResolver: true,
  },
};
