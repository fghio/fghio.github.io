<?php
if (isset($_POST['submit'])) {
  $name = $_POST['name'];
  $email = $_POST['email'];
  $subject = $_POST['subject'];
  $message = $_POST['message'];

  $to = "your-email@example.com";
  $subject = "New Message from $name";
  $body = "Name: $name\nEmail: $email\n\n$message";

  if (mail($to, $subject, $body)) {
    echo "Message sent successfully.";
  } else {
    echo "Message could not be sent.";
  }
}
?>
