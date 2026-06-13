"use client"

import { useState } from 'react';
import { generateQuizQuestions, GenerateQuizQuestionsOutput } from '@/ai/flows/instructor-generates-quiz-questions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Sparkles, Loader2, Save, Trash2, CheckCircle2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

export default function QuizGeneratorPage() {
  const [lessonContent, setLessonContent] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<GenerateQuizQuestionsOutput>([]);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!lessonContent.trim()) {
      toast({
        title: "Content required",
        description: "Please provide lesson content to generate questions from.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await generateQuizQuestions({
        lessonContent,
        numberOfQuestions,
        questionTypes: ['multiple_choice']
      });
      setQuestions(result);
      toast({
        title: "Success!",
        description: `Generated ${result.length} questions successfully.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate questions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-accent" /> AI Quiz Generator
        </h2>
        <p className="text-muted-foreground">Automatically create assessments from your teaching materials.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card className="border-none shadow-sm h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Configuration</CardTitle>
              <CardDescription>Adjust generator settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="num-q">Number of Questions</Label>
                <Input 
                  id="num-q" 
                  type="number" 
                  min={1} 
                  max={20} 
                  value={numberOfQuestions}
                  onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-3">
                <Label>Question Types</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox id="mc" checked />
                  <label htmlFor="mc" className="text-sm font-medium leading-none">Multiple Choice</label>
                </div>
                <div className="flex items-center space-x-2 opacity-50 cursor-not-allowed">
                  <Checkbox id="tf" disabled />
                  <label htmlFor="tf" className="text-sm font-medium leading-none">True / False</label>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGenerate} 
                className="w-full bg-primary" 
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate Questions</>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Lesson Content</CardTitle>
              <CardDescription>Paste the text content or transcript of your lesson here.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="React hooks are a powerful feature that let you use state and other React features without writing a class..."
                className="min-h-[250px] resize-none focus-visible:ring-accent"
                value={lessonContent}
                onChange={(e) => setLessonContent(e.target.value)}
              />
            </CardContent>
          </Card>

          {questions.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Generated Questions</h3>
                <Button variant="outline" size="sm" className="gap-2">
                  <Save className="h-4 w-4" /> Save Quiz to Course
                </Button>
              </div>
              
              {questions.map((q, idx) => (
                <Card key={idx} className="border-none shadow-sm relative group overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded mb-2">
                        Question {idx + 1}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeQuestion(idx)}
                        className="text-muted-foreground hover:text-destructive h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-base leading-snug">{q.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {q.options?.map((opt, optIdx) => (
                      <div 
                        key={optIdx} 
                        className={`text-sm p-3 rounded-lg border flex items-center gap-2 ${opt === q.answer ? 'bg-green-50 border-green-200' : 'bg-muted/30 border-transparent'}`}
                      >
                        <div className={`h-2 w-2 rounded-full ${opt === q.answer ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                        {opt}
                        {opt === q.answer && <CheckCircle2 className="h-4 w-4 ml-auto text-green-600" />}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
