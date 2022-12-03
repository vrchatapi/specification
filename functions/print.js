export default (input) => {
  // Debug: Print the type and value
  console.log(typeof input, input);
  return [
    {
      message: "Value type: " + typeof input + ", value: " + JSON.stringify(input),
    },
  ];
};
