export type Book = {
  id: number;
  title: string;
  author: string;
  explanation: string;
  language: string;
  category: string;
  lentTo: string;
  hidden: number;
  createdAt: string;
};

export type LendingLog = {
  id: number;
  bookId: number;
  bookTitle: string;
  borrower: string;
  action: string;
  note: string;
  createdAt: string;
};
