export default function ContactForm() {
  return (
    <form>
      {/* Basic form structure */}
      <label htmlFor="name">Name:</label>
      <input type="text" id="name" name="name" />
      <button type="submit">Submit</button>
    </form>
  );
} 