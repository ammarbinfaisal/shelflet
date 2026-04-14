export type Book = {
  id: number;
  title: string;
  slug: string;
  author: string;
  authorFullName: string;
  authorShortName: string;
  translator: string;
  explanation: string;
  language: string;
  category: string;
  lentTo: string;
  totalCopies: number;
  availableCopies: number;
  hidden: number;
  createdAt: string;
};

export type ActiveLending = {
  id: number;
  bookId: number;
  borrower: string;
  borrowerContact: string;
  note: string;
  lentAt: string;
};

export type Author = {
  id: number;
  shortName: string;
  fullName: string;
  bio: string;
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
