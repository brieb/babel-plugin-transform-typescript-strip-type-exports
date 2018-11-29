import { Foo, Bar as IBar } from "./types";

interface Bar extends IBar {}
class Bar {}

export { Foo, Bar };
