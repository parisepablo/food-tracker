import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { instruction, currentPlan, recipes, rules } = body;

    if (!instruction || !currentPlan || !recipes) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build context
    const recipesContext = recipes.map((r: { id: string; name: string }) => 
      `- ${r.id}: ${r.name}`
    ).join("\n");

    const rulesContext = rules && rules.length > 0
      ? rules.map((r: { rule_type: string; rule_config: Record<string, unknown> }) =>
          `- ${r.rule_type}: ${JSON.stringify(r.rule_config)}`
        ).join("\n")
      : "No hay reglas activas";

    const planContext = JSON.stringify(currentPlan, null, 2);

    const prompt = `Eres un asistente que ajusta planes de comidas semanales. 

CONTEXTO:
- Recetas disponibles:
${recipesContext}

- Reglas activas:
${rulesContext}

- Plan actual:
${planContext}

INSTRUCCIÓN DEL USUARIO:
${instruction}

TAREAS:
1. Analiza la instrucción del usuario
2. Modifica el plan actual según la instrucción
3. Respeta todas las reglas activas
4. Solo usa recetas que existen en la lista de recetas disponibles
5. Si no puedes cumplir la instrucción, devuelve el plan original sin cambios

FORMATO DE RESPUESTA:
Debes devolver ÚNICAMENTE un JSON válido con este formato exacto, sin markdown, sin texto adicional:

{
  "week_start": "YYYY-MM-DD",
  "entries": [
    {
      "date": "YYYY-MM-DD",
      "meal_type": "breakfast|lunch|dinner|snack",
      "recipe_id": "uuid",
      "recipe_name": "nombre de la receta"
    }
  ],
  "conflicts": [
    {
      "date": "YYYY-MM-DD",
      "meal_type": "breakfast|lunch|dinner|snack",
      "reason": "razón del conflicto"
    }
  ],
  "message": "explicación de los cambios realizados o por qué no se pudieron realizar"
}

IMPORTANTE:
- Devuelve SOLO el JSON, sin markdown, sin bloques de código, sin texto antes o después
- El JSON debe ser válido y parseable
- No inventes recetas que no existen en la lista
- Respeta las reglas de variedad, distribución y frecuencia de proteínas
- Si la instrucción no se puede cumplir, mantén el plan original y explica por qué en el campo "message"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Try to extract JSON if there's any markdown formatting
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    try {
      const parsedResponse = JSON.parse(text);
      return NextResponse.json(parsedResponse);
    } catch {
      console.error("Failed to parse Gemini response:", text);
      return NextResponse.json(
        {
          week_start: currentPlan.week_start,
          entries: currentPlan.entries,
          conflicts: currentPlan.conflicts || [],
          message: "No se pudo procesar la respuesta de la IA. El plan se mantiene sin cambios.",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return NextResponse.json(
      { error: "Failed to adjust plan with AI" },
      { status: 500 }
    );
  }
}
