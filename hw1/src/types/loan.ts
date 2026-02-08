export type LoanStatus = "ACTIVE" | "RETURNED";

export type Loan = {
  id: string;
  userId: string;
  bookId: string;
  loanDate: Date;
  returnDate: Date | null;
  status: LoanStatus;
}