package com.bits2brain.backend.util;

import java.io.*;
import java.nio.file.*;
import java.security.*;
import java.util.*;

public class FileUtils {
    private static final String MD5_STORAGE_FILE = "backend/data/uploaded_videos_md5.txt";

    public static String calculateMD5(File file) throws Exception {
        MessageDigest md = MessageDigest.getInstance("MD5");
        try (InputStream is = Files.newInputStream(file.toPath())) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = is.read(buffer)) != -1) {
                md.update(buffer, 0, read);
            }
        }
        byte[] digest = md.digest();
        StringBuilder sb = new StringBuilder();
        for (byte b : digest) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    public static boolean isDuplicate(String md5) {
        try {
            File file = new File(MD5_STORAGE_FILE);
            if (!file.exists()) {
                return false;
            }
            List<String> lines = Files.readAllLines(file.toPath());
            return lines.contains(md5);
        } catch (IOException e) {
            return false;
        }
    }

    public static void saveMD5(String md5) {
        try (FileWriter fw = new FileWriter(MD5_STORAGE_FILE, true)) {
            fw.write(md5 + "\n");
        } catch (IOException e) {
            // Ignore
        }
    }
}
