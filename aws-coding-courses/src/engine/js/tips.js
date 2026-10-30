// Plain-English tips for common JavaScript errors, shown under the error
// in the console. Shared by the runner and the page preview.
export const TIPS = [
  [/Cannot (read|set) propert(y|ies) of (undefined|null)/, 'Something on the left of the dot is undefined or null: often querySelector found nothing (check the selector), a missing key, or a missing return. Print it to see what you really have; `?.` reads safely: obj?.name.'],
  [/is not defined$/, 'JavaScript doesn\'t know that name. Check the spelling (capitals count), and that it\'s declared or imported before it\'s used.'],
  [/is not a function/, 'That value isn\'t a function. Check the name, and that you imported it: { name } in braces for named exports.'],
  [/Assignment to constant variable/, 'A `const` can\'t be given a new value. Use `let` for values that change.'],
  [/is not valid JSON|Unexpected token .* JSON|JSON\.parse/, 'This text isn\'t valid JSON. Print it first: it\'s often an error page, an empty string, or already an object.'],
  [/^SyntaxError/, 'JavaScript couldn\'t read the code. Look for a missing bracket, brace, quote or comma, especially near the end of what you last changed.'],
  [/Cannot use import statement|Unexpected token 'export'/, 'Imports and exports only work at the top level of a file, not inside a function or block.'],
  [/await is only valid/, '`await` only works inside an `async` function (or at the top level of a module).'],
  [/Failed to fetch/, 'The request got no answer: the address doesn\'t exist or the server is down. Check the URL, and catch the error so the program can carry on.'],
];
