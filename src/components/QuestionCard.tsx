import { ThumbsUp, ThumbsDown } from "lucide-react";

interface QuestionCardProps {
  question: { id: string; text: string; icon: string };
  onAnswer: (answer: boolean) => void;
}

const QuestionCard = ({ question, onAnswer }: QuestionCardProps) => {
  return (
    <div className="comic-panel mx-auto max-w-lg p-8 animate-slide-in">
      <div className="mb-6 text-center">
        <span className="mb-4 block text-5xl">{question.icon}</span>
        <h2 className="text-xl font-bold leading-relaxed md:text-2xl text-balance">
          {question.text}
        </h2>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => onAnswer(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-success py-4 text-lg font-bold text-success-foreground transition-transform hover:scale-105 active:scale-95"
        >
          <ThumbsUp className="h-5 w-5" />
          Igen!
        </button>
        <button
          onClick={() => onAnswer(false)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-4 text-lg font-bold text-primary-foreground transition-transform hover:scale-105 active:scale-95"
        >
          <ThumbsDown className="h-5 w-5" />
          Nem
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;
