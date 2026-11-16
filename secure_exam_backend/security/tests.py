from django.test import SimpleTestCase, override_settings
from cryptography.fernet import Fernet
from .encryption import encrypt_answer_key, decrypt_answer_key

TEST_KEY = Fernet.generate_key().decode()
@override_settings(ANSWER_KEY_ENCRYPTION_KEY=TEST_KEY, ANSWER_KEY_KEY_VERSION="v1")
class EncryptionTests(SimpleTestCase):
    def test_round_trip(self):
        value = {"correct_option": "A"}
        encrypted = encrypt_answer_key(value)
        self.assertEqual(decrypt_answer_key(encrypted, "v1"), value)
        self.assertNotIn(b"correct_option", encrypted)
