import { HttpException } from "@nestjs/common";
export declare class UserException extends HttpException {
  static notFound(): HttpException;
  static emailAlreadyExists(): HttpException;
  static accountInactive(): HttpException;
}
