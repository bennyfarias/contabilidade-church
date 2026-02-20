// src/services/uploadService.ts

export const UploadService = {
  uploadFile: async (file: File): Promise<string> => {
    // 1. Validação de Tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('O arquivo é muito grande. Máximo permitido: 5MB.');
    }

    // 2. Configurações do Cloudinary
    // -----------------------------------------------------------
    // TROQUE ISSO PELO SEU "CLOUD NAME" DO CLOUDINARY:
    const cloudName = "dgsip35l7"; 
    // -----------------------------------------------------------
    
    const uploadPreset = "church_receipts"; // Certifique-se de criar este preset no painel do Cloudinary como "Unsigned"

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "comprovantes_igreja");

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Falha no upload da imagem.");
      }

      // Retorna a URL segura (HTTPS)
      return data.secure_url;
    } catch (error) {
      console.error("Erro no serviço de upload:", error);
      throw error;
    }
  }
};