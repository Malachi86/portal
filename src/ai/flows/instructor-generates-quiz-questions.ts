'use server';
/**
 * @fileOverview This file defines a Genkit flow for instructors to generate quiz questions.
 *
 * - generateQuizQuestions - A function that generates quiz questions based on lesson content and topics.
 * - GenerateQuizQuestionsInput - The input type for the generateQuizQuestions function.
 * - GenerateQuizQuestionsOutput - The return type for the generateQuizQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizQuestionsInputSchema = z.object({
  lessonContent: z.string().describe('The content of the lesson.'),
  topics: z
    .array(z.string())
    .optional()
    .describe('Specific topics to generate questions about.'),
  numberOfQuestions:
    z.number().optional().default(5).describe('The desired number of questions to generate.'),
  questionTypes:
    z.array(z.enum(['multiple_choice', 'true_false', 'short_answer']))
      .optional()
      .default(['multiple_choice'])
      .describe('The desired types of questions (e.g., multiple_choice, true_false, short_answer).'),
});
export type GenerateQuizQuestionsInput = z.infer<typeof GenerateQuizQuestionsInputSchema>;

const QuizQuestionSchema = z.object({
  question: z.string().describe('The quiz question text.'),
  type:
    z.enum(['multiple_choice', 'true_false', 'short_answer'])
      .describe('The type of quiz question.'),
  options:
    z.array(z.string()).optional().describe('For multiple choice questions, the list of possible answers.'),
  answer:
    z.string()
      .describe(
        'The correct answer for multiple choice, or the expected answer for true/false/short answer.'
      ),
});
const GenerateQuizQuestionsOutputSchema = z.array(QuizQuestionSchema).describe('An array of generated quiz questions.');
export type GenerateQuizQuestionsOutput = z.infer<typeof GenerateQuizQuestionsOutputSchema>;

export async function generateQuizQuestions(
  input: GenerateQuizQuestionsInput
): Promise<GenerateQuizQuestionsOutput> {
  return generateQuizQuestionsFlow(input);
}

const quizPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizQuestionsInputSchema},
  output: {schema: GenerateQuizQuestionsOutputSchema},
  prompt: `You are an AI assistant specialized in creating quiz questions for educational purposes.\nGenerate {{numberOfQuestions}} quiz questions based on the provided lesson content and topics.\nEach question should be a JSON object with 'question', 'type', 'options' (if multiple choice), and 'answer' fields.\n\nFocus on question types: {{#each questionTypes}}- {{this}}\n{{/each}}\n\nHere is the lesson content:\n{{{lessonContent}}}\n\n{{#if topics}}\nAdditionally, focus on these specific topics:\n{{#each topics}}- {{this}}\n{{/each}}\n{{/if}}\n\nFor multiple choice questions:\n- Provide exactly 4 distinct options in the 'options' array.\n- The 'answer' field must be one of the strings present in the 'options' array.\n\nFor true/false questions:\n- The 'answer' field must be either "True" or "False".\n\nFor short answer questions:\n- The 'answer' field should contain a concise, expected correct answer.\n\nEnsure the questions are engaging and cover key concepts.\nYour output must be a JSON array of quiz question objects, strictly following the provided schema.\n`,
});

const generateQuizQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuizQuestionsFlow',
    inputSchema: GenerateQuizQuestionsInputSchema,
    outputSchema: GenerateQuizQuestionsOutputSchema,
  },
  async input => {
    const {output} = await quizPrompt(input);
    if (!output) {
      throw new Error('Failed to generate quiz questions.');
    }
    return output;
  }
);
