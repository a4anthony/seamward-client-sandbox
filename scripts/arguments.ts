export function firstScriptArgument(arguments_: string[]): string | undefined {
  return arguments_.find((argument) => argument !== "--");
}
