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
  const userId = session.id;

  switch (method) {
    case "POST":
      try {
        const { name } = req.body;
        const supplier = await prisma.supplier.create({
          data: {
            name,
            userId,
          },
        });
        res.status(201).json(supplier);
      } catch (error) {
        console.error("Error creando el proveedor:", error);
        res.status(500).json({ error: "Fallo al crear el proveedor" });
      }
      break;
    case "GET":
      try {
        const suppliers = await prisma.supplier.findMany({
          where: { userId },
        });
        res.status(200).json(suppliers);
      } catch (error) {
        console.error("Error obteniendo los proveedores:", error);
        res.status(500).json({ error: "Fallo al obtener los proveedores" });
      }
      break;
    case "PUT":
      try {
        const { id, name } = req.body;

        if (!id || !name) {
          return res.status(400).json({ error: "ID y nombre son obligatorios" });
        }

        const updatedSupplier = await prisma.supplier.update({
          where: { id },
          data: { name },
        });

        res.status(200).json(updatedSupplier);
      } catch (error) {
        console.error("Error actualizando el proveedor:", error);
        res.status(500).json({ error: "Fallo al actualizar el proveedor" });
      }
      break;
    case "DELETE":
      try {
        const { id } = req.body;

        const supplier = await prisma.supplier.findUnique({
          where: { id },
        });

        if (!supplier) {
          return res.status(404).json({ error: "Proveedor no encontrado" });
        }

        await prisma.supplier.delete({
          where: { id },
        });

        res.status(204).end();
      } catch (error) {
        console.error("Error eliminando el proveedor:", error);
        res.status(500).json({ error: "Fallo al eliminar el proveedor" });
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
