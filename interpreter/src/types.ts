
export interface Type {
    // TODO: prettyPrint(indentation: number): void;
}

export class Function implements Type {
    parameterType: Type;
    returnType: Type;
}
