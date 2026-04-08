export type Book = {
  id: number;
  title: string;
  slug: string;
  author: string;
  authorFullName: string;
  authorShortName: string;
  explanation: string;
  language: string;
  category: string;
  lentTo: string;
  hidden: number;
  createdAt: string;
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
