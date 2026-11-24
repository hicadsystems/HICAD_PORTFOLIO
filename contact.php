<?php
/**
 * HICAD Systems Limited - website enquiry form handler.
 *
 * Receives the form on the home page (/#contact), checks it, and emails it to
 * the address below using the web server's own mail (no third-party service).
 * Replies as JSON so the page can show the result without reloading.
 *
 * Works on PHP 7.2 and newer.
 */

/* ---------- Settings: the only part you should need to edit ---------- */

// Where enquiries are delivered.
const TO_EMAIL = 'info@hicadsystemsltd.com';

// The "sent from" address. Use an address on your own domain (it does not
// have to be a real mailbox). Mail sent "from" other domains is often rejected.
const FROM_EMAIL = 'website@hicadsystemsltd.com';

// Maximum messages accepted from one visitor per hour (stops form spam).
const MAX_PER_HOUR = 5;

// Messages sent faster than this after the page loaded are treated as bots.
const MIN_SECONDS_ON_PAGE = 3;

// Must match the options in the form's "What's this about?" menu.
const TOPICS = [
    'Insurance IT',
    'Payroll & HR Systems',
    'e-Procurement (abcProcure)',
    'Computer & Communications Consulting',
    'General enquiry',
];

/* ---------- Helpers ---------- */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow');

function respond($status, $ok, $message = '')
{
    http_response_code($status);
    echo json_encode(['ok' => $ok, 'error' => $ok ? null : $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function text_length($s)
{
    return function_exists('mb_strlen') ? mb_strlen($s, 'UTF-8') : strlen($s);
}

// Trim, collapse whitespace and strip control characters (stops header injection).
function clean_line($value, $max)
{
    $value = is_string($value) ? $value : '';
    $value = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $value);
    $value = trim(preg_replace('/\s+/u', ' ', (string) $value));
    return function_exists('mb_substr') ? mb_substr($value, 0, $max, 'UTF-8') : substr($value, 0, $max);
}

// Keep new lines in the message body, strip every other control character.
function clean_block($value, $max)
{
    $value = is_string($value) ? $value : '';
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    $value = preg_replace('/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]+/', '', (string) $value);
    $value = trim((string) $value);
    return function_exists('mb_substr') ? mb_substr($value, 0, $max, 'UTF-8') : substr($value, 0, $max);
}

// Safe for use inside an email header, including non-English characters
// (encoded as RFC 2047 "encoded words"; does not need the mbstring extension).
function header_text($value)
{
    $value = str_replace(['"', '<', '>'], '', $value);
    if (preg_match('/^[\x20-\x7E]*$/', $value)) {
        return $value;
    }
    $chars = preg_split('//u', $value, -1, PREG_SPLIT_NO_EMPTY);
    if ($chars === false) {
        return preg_replace('/[^\x20-\x7E]/', '?', $value);
    }
    $words = [];
    $chunk = '';
    foreach ($chars as $char) {
        if (strlen($chunk) + strlen($char) > 30) { // keeps each word under 75 characters
            $words[] = '=?UTF-8?B?' . base64_encode($chunk) . '?=';
            $chunk = '';
        }
        $chunk .= $char;
    }
    if ($chunk !== '') {
        $words[] = '=?UTF-8?B?' . base64_encode($chunk) . '?=';
    }
    return implode("\r\n ", $words);
}

function visitor_ip()
{
    // Behind Cloudflare, REMOTE_ADDR is Cloudflare's address, not the visitor's.
    foreach (['HTTP_CF_CONNECTING_IP', 'REMOTE_ADDR'] as $key) {
        if (!empty($_SERVER[$key]) && filter_var($_SERVER[$key], FILTER_VALIDATE_IP)) {
            return $_SERVER[$key];
        }
    }
    return '0.0.0.0';
}

// True when the visitor has used up their hourly allowance.
function rate_limited($ip)
{
    $file = rtrim(sys_get_temp_dir(), '/\\') . '/hicad_form_' . hash('sha256', $ip) . '.json';
    $handle = @fopen($file, 'c+');
    if (!$handle) {
        return false; // never block real visitors because of a file problem
    }
    flock($handle, LOCK_EX);
    $now = time();
    $times = json_decode((string) stream_get_contents($handle), true);
    $times = is_array($times) ? array_values(array_filter($times, function ($t) use ($now) {
        return is_int($t) && $t > $now - 3600;
    })) : [];
    $limited = count($times) >= MAX_PER_HOUR;
    if (!$limited) {
        $times[] = $now;
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($times));
    }
    flock($handle, LOCK_UN);
    fclose($handle);
    return $limited;
}

/* ---------- Checks ---------- */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'This address only accepts the contact form.');
}

// Only accept submissions that come from this website.
$source = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
if ($source !== '') {
    $normalise = function ($host) {
        return preg_replace('/^www\./i', '', strtolower((string) $host));
    };
    $sourceHost = $normalise(parse_url($source, PHP_URL_HOST));
    $ownHost = $normalise(parse_url('//' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST));
    if ($sourceHost === '' || $sourceHost !== $ownHost) {
        respond(403, false, 'This request was not accepted.');
    }
}

// Hidden trap field: real visitors never see or fill it. Pretend it worked.
if (!empty($_POST['botcheck'])) {
    respond(200, true);
}

// Form is stamped with the page-load time by script.js; bots skip that.
$loadedAt = isset($_POST['ts']) ? (int) $_POST['ts'] : 0;
$elapsed = time() - (int) floor($loadedAt / 1000);
if ($loadedAt <= 0 || $elapsed < MIN_SECONDS_ON_PAGE) {
    respond(400, false, 'Please wait a moment and send your message again.');
}

$name = clean_line($_POST['name'] ?? '', 100);
$organisation = clean_line($_POST['organisation'] ?? '', 120);
$email = clean_line($_POST['email'] ?? '', 150);
$phone = clean_line($_POST['phone'] ?? '', 40);
$topic = clean_line($_POST['topic'] ?? '', 80);
$message = clean_block($_POST['message'] ?? '', 5000);

if (text_length($name) < 2) {
    respond(422, false, 'Please enter your full name.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, false, 'Please enter a valid email address so we can reply.');
}
if (!in_array($topic, TOPICS, true)) {
    respond(422, false, 'Please choose what your message is about.');
}
if (text_length($message) < 10) {
    respond(422, false, 'Please write a little more about what you need.');
}
if (preg_match_all('~https?://|www\.~i', $message) > 2) {
    respond(422, false, 'Please remove the links from your message and try again.');
}

if (rate_limited(visitor_ip())) {
    respond(429, false, 'You have sent several messages already. Please try again later or email ' . TO_EMAIL . '.');
}

/* ---------- Send ---------- */

date_default_timezone_set('Africa/Lagos');

$subject = header_text("Website enquiry: {$topic} | {$name}");

$body = implode("\n", [
    'New enquiry from the HICAD website',
    str_repeat('-', 40),
    "Name:         {$name}",
    'Organisation: ' . ($organisation !== '' ? $organisation : '-'),
    "Email:        {$email}",
    'Phone:        ' . ($phone !== '' ? $phone : '-'),
    "Topic:        {$topic}",
    'Received:     ' . date('D, j M Y, g:i A') . ' (Lagos time)',
    str_repeat('-', 40),
    '',
    $message,
    '',
]);

$headers = implode("\r\n", [
    'From: ' . header_text('HICAD Website') . ' <' . FROM_EMAIL . '>',
    'Reply-To: ' . header_text($name) . ' <' . $email . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: HICAD website contact form',
]);

// "-f" sets the envelope sender so the message passes the server's mail checks.
$sent = @mail(TO_EMAIL, $subject, $body, $headers, '-f' . FROM_EMAIL);

if (!$sent) {
    error_log('HICAD contact form: mail() failed for enquiry from ' . $email);
    respond(500, false, 'Sorry, your message could not be sent. Please email ' . TO_EMAIL . ' directly.');
}

respond(200, true);
