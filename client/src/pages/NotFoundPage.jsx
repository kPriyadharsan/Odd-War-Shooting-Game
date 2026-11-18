import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';

export const NotFoundPage = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <Card variant="taped" className="max-w-md w-full p-8 flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-[#EFE8DA] border border-[#D5CFC3] text-[#CE4242] flex items-center justify-center mb-4">
          <FileQuestion className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-handwriting font-bold text-[#23252A] mb-2">
          Page Torn from the Notebook
        </h1>
        <p className="text-sm text-[#5C6069] mb-6">
          The page or battle sector you are looking for does not exist in this exercise book.
        </p>
        <Link to="/">
          <Button variant="primary">
            Return to Design System
          </Button>
        </Link>
      </Card>
    </div>
  );
};

export default NotFoundPage;
