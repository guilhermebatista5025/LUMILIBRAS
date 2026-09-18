import sys
import unittest
from pathlib import Path

MODULE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(MODULE_ROOT))

from lumilibras_video.dataset import discover_videos


class DatasetTest(unittest.TestCase):
    def test_discovers_expected_structure(self):
        root = Path(__file__).resolve().parent / "fixtures" / "valid"
        sample = discover_videos(root)[0]
        self.assertEqual(sample.activity, "saude")
        self.assertEqual(sample.label, "hospital")
        self.assertEqual(sample.signer, "pessoa-01")

    def test_rejects_video_outside_signer_directory(self):
        root = Path(__file__).resolve().parent / "fixtures" / "invalid"
        with self.assertRaisesRegex(ValueError, "Estrutura inválida"):
            discover_videos(root)


if __name__ == "__main__":
    unittest.main()
