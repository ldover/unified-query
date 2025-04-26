/* helper – wrap raw body in a Segment stub */
// TODO are these equivalent helpers?
// function seg(keyword: string, body: string): Segment {
//     return {
//       keyword,
//       body,
//       raw: '@' + keyword + (body ? ' ' + body : ''),
//       from: 0,
//       to: body.length,
//     };
//   }
  
export function seg(keyword: string, body: string): Segment {
    return {
      keyword,
      body,
      raw: '@' + keyword + (body ? ' ' + body : ''),
      from: 0,
      to: body.length + keyword.length + 1,
    };
  }